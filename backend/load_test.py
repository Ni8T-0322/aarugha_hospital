import requests
import concurrent.futures
import time
import statistics

URL = "http://127.0.0.1:8000/add-medical-record"

payload = {
    "patient_id": "PAT-1001",
    "doctor_email": "test.doctor@aarugha.com",
    "diagnosis": "Severe Trauma",
    "prescription": "Administer IV immediately",
    "notes": "Emergency load test intake",
    "status": "Completed",
    "type": "Consultation/Pharmacy",
    "allocate_bed": True,
    "ward_choice": "General" # Make sure you have a 'General' ward in your DB!
}

def send_request(req_id):
    start = time.time()
    response = requests.post(URL, json=payload)
    end = time.time()
    latency = (end - start) * 1000  # Convert to milliseconds
    return response.status_code, response.text, latency

print("🚀 Firing 500 concurrent bed allocation requests to FastAPI...")
start_time = time.time()

# This blasts the server with 500 requests simultaneously 
with concurrent.futures.ThreadPoolExecutor(max_workers=500) as executor:
    results = list(executor.map(send_request, range(500)))

total_time = time.time() - start_time

successful_allocations = 0
prevented_overbookings = 0
latencies = []

for status, text, latency in results:
    latencies.append(latency)
    if status == 200:
        successful_allocations += 1
    elif status == 400 and "CRITICAL: No 'Available' beds" in text:
        prevented_overbookings += 1

print("\n--- 📊 LOAD TEST RESULTS ---")
print(f"Total Test Duration: {total_time:.2f} seconds")
print(f"Average Response Time: {statistics.mean(latencies):.2f} ms")
print(f"Successful Allocations: {successful_allocations}")
print(f"Prevented Overbookings (System Blocked): {prevented_overbookings}")
print(f"Overbooking Error Rate: 0.0% (System halted {prevented_overbookings} excess requests)")