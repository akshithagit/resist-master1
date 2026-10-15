"""
ResistAI - Baseline & Concurrency Load Testing Suite
Simulates 100 concurrent virtual users sending continuous requests for 1 minute (60 seconds).
Measures Requests Per Second (RPS), Latency (Min, Avg, Median, p95, Max), and Error Rates.
"""

import asyncio
import time
import statistics
import argparse
from typing import List, Dict, Any
import httpx

API_BASE_URL = "http://127.0.0.1:8000"

SAMPLE_PREDICT_PAYLOAD = {
    "ocr_text": (
        "Microbiology Culture & Susceptibility Report\n"
        "Specimen: Urine (Initialstream)\n"
        "Organism: Escherichia coli isolated > 100,000 CFU/mL\n"
        "AST Panel:\n"
        "Ciprofloxacin: Resistant\n"
        "Nitrofurantoin: Susceptible\n"
        "Ceftriaxone: Resistant\n"
        "Amoxicillin-Clavulanate: Intermediate\n"
        "Phenotype: ESBL positive"
    ),
    "organism": "Escherichia coli",
    "specimen": "Initialstream",
    "symptoms": "Dysuria, urinary urgency",
    "symptom_duration": "1-3 days",
    "severity": "Moderate",
    "infection_type": "Uncomplicated UTI",
    "previous_antibiotic_exposure": "One previous course",
    "course_completion": "Full course completed",
    "persistent_infection": "First episode"
}

class LoadTestRunner:
    def __init__(self, concurrency: int = 100, duration_seconds: int = 60, target_endpoint: str = "mixed", think_time: float = 0.5):
        self.concurrency = concurrency
        self.duration_seconds = duration_seconds
        self.target_endpoint = target_endpoint
        self.think_time = think_time
        self.latencies: List[float] = []
        self.success_count = 0
        self.error_count = 0
        self.status_codes: Dict[int, int] = {}
        self.errors: List[str] = []

    async def user_worker(self, client: httpx.AsyncClient, stop_time: float, worker_id: int):
        endpoint_cycle = ["/health", "/predict-risk", "/extract-features"]
        cycle_idx = worker_id % len(endpoint_cycle)

        # Stagger initial user arrival slightly (ramp-up within 1 second)
        await asyncio.sleep((worker_id / max(1, self.concurrency)) * 1.0)

        while time.time() < stop_time:
            # Determine endpoint
            if self.target_endpoint == "mixed":
                endpoint = endpoint_cycle[cycle_idx]
                cycle_idx = (cycle_idx + 1) % len(endpoint_cycle)
            elif self.target_endpoint == "predict":
                endpoint = "/predict-risk"
            else:
                endpoint = "/health"

            t0 = time.perf_counter()
            try:
                if endpoint == "/health":
                    resp = await client.get(f"{API_BASE_URL}/health")
                elif endpoint == "/extract-features":
                    resp = await client.post(
                        f"{API_BASE_URL}/extract-features",
                        json={"ocr_text": SAMPLE_PREDICT_PAYLOAD["ocr_text"]}
                    )
                else:
                    resp = await client.post(
                        f"{API_BASE_URL}/predict-risk",
                        json=SAMPLE_PREDICT_PAYLOAD
                    )

                duration_ms = (time.perf_counter() - t0) * 1000.0
                self.latencies.append(duration_ms)
                status = resp.status_code
                self.status_codes[status] = self.status_codes.get(status, 0) + 1

                if resp.is_success:
                    self.success_count += 1
                else:
                    self.error_count += 1
            except Exception as e:
                duration_ms = (time.perf_counter() - t0) * 1000.0
                self.latencies.append(duration_ms)
                self.error_count += 1
                if len(self.errors) < 5:
                    self.errors.append(str(e))

            # Realistic user think-time between actions
            if self.think_time > 0:
                await asyncio.sleep(self.think_time)

    async def run(self):
        print("\n" + "=" * 65)
        print("          ResistAI Baseline & Concurrency Load Test")
        print("=" * 65)
        print(f"Target URL:         {API_BASE_URL}")
        print(f"Concurrent Users:   {self.concurrency} virtual users")
        print(f"Test Duration:      {self.duration_seconds} seconds (1 minute)")
        print(f"Workload Mode:      {self.target_endpoint.upper()} (Health + ML Predict + NLP Feature Extract)")
        print("-" * 65)
        print("Executing benchmark... please wait...")

        # Warmup connection
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                warm = await client.get(f"{API_BASE_URL}/health")
                if warm.status_code != 200:
                    print(f"Warning: Health check returned {warm.status_code}")
            except Exception as e:
                print(f"Error: Unable to connect to {API_BASE_URL}. Ensure FastAPI backend is running! ({e})")
                return False

        limits = httpx.Limits(max_keepalive_connections=self.concurrency, max_connections=self.concurrency * 2)
        timeout = httpx.Timeout(20.0, connect=10.0)

        start_time = time.perf_counter()
        stop_time = time.time() + self.duration_seconds

        async with httpx.AsyncClient(limits=limits, timeout=timeout) as client:
            workers = [
                asyncio.create_task(self.user_worker(client, stop_time, i))
                for i in range(self.concurrency)
            ]
            await asyncio.gather(*workers)

        total_elapsed = time.perf_counter() - start_time
        total_requests = len(self.latencies)
        rps = total_requests / total_elapsed if total_elapsed > 0 else 0

        self.display_results(total_requests, total_elapsed, rps)
        return self.error_count == 0 and rps >= 50

    def display_results(self, total_requests: int, elapsed_time: float, rps: float):
        if not self.latencies:
            print("No requests completed.")
            return

        sorted_latencies = sorted(self.latencies)
        min_lat = sorted_latencies[0]
        max_lat = sorted_latencies[-1]
        avg_lat = statistics.mean(sorted_latencies)
        median_lat = statistics.median(sorted_latencies)
        p95_lat = sorted_latencies[int(len(sorted_latencies) * 0.95)]
        p99_lat = sorted_latencies[int(len(sorted_latencies) * 0.99)]

        print("\n" + "=" * 65)
        print("                     LOAD TEST RESULTS")
        print("=" * 65)
        print(f"Test Duration:        {elapsed_time:.2f} seconds")
        print(f"Virtual Users (VUs):  {self.concurrency}")
        print(f"Total Requests Sent:  {total_requests:,}")
        print(f"Successful Requests:  {self.success_count:,} ({((self.success_count / max(1, total_requests)) * 100):.2f}%)")
        print(f"Failed Requests:      {self.error_count:,}")
        print(f"Status Code Breakdown: {dict(self.status_codes)}")

        print("\n" + "-" * 30 + " THROUGHPUT " + "-" * 23)
        print(f"Requests per second (RPS):  {rps:.2f} req/sec")

        print("\n" + "-" * 30 + " RESPONSE TIME " + "-" * 20)
        print(f"Min Response Time:     {min_lat:.2f} ms")
        print(f"Average Response Time: {avg_lat:.2f} ms")
        print(f"Median (p50):          {median_lat:.2f} ms")
        print(f"95th Percentile (p95): {p95_lat:.2f} ms")
        print(f"99th Percentile (p99): {p99_lat:.2f} ms")
        print(f"Max Response Time:     {max_lat:.2f} ms")

        print("\n" + "=" * 65)
        # Target criteria: Error rate = 0%, Average < 250ms, Max < 1500ms
        passed = (
            self.error_count == 0 and
            avg_lat < 250.0 and
            max_lat < 1500.0 and
            rps >= 100.0
        )

        if passed:
            print(" ✅ LOAD TEST PASSED: All performance benchmarks satisfied!")
            print(f"    • High Throughput: {rps:.1f} req/sec (Expected >= 100)")
            print(f"    • Fast Average:    {avg_lat:.1f} ms (Expected < 250ms)")
            print(f"    • Controlled Max:  {max_lat:.1f} ms (Expected < 1500ms)")
            print(f"    • Zero Errors:     {self.error_count} failures across {total_requests:,} requests")
        else:
            print(" ⚠️  PERFORMANCE BENCHMARK ASSESSMENT:")
            print(f"    • Throughput:      {rps:.1f} req/sec")
            print(f"    • Average Latency: {avg_lat:.1f} ms (Target < 250ms: {'PASS' if avg_lat < 250 else 'FAIL'})")
            print(f"    • Max Latency:     {max_lat:.1f} ms (Target < 1500ms: {'PASS' if max_lat < 1500 else 'FAIL'})")
            print(f"    • Error Rate:      {((self.error_count / max(1, total_requests)) * 100):.2f}%")
        print("=" * 65 + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ResistAI Baseline/Load Testing Tool")
    parser.add_argument("--users", type=int, default=100, help="Number of concurrent virtual users (default: 100)")
    parser.add_argument("--duration", type=int, default=60, help="Test duration in seconds (default: 60)")
    parser.add_argument("--mode", type=str, default="mixed", choices=["mixed", "predict", "health"], help="Workload mode")
    parser.add_argument("--think-time", type=float, default=0.5, help="Think time between requests per user (default: 0.5s)")
    args = parser.parse_args()

    runner = LoadTestRunner(
        concurrency=args.users,
        duration_seconds=args.duration,
        target_endpoint=args.mode,
        think_time=args.think_time
    )
    asyncio.run(runner.run())
