import numpy as np
import time
from chunking import Chunker
from vector_db import InMemoryVectorDB
from rag_pipeline import RagPipelineOrchestrator, MockSTT, MockEmbedder, MockLLM

def setup_mock_db():
    print("Setting up Vector DB...")
    db = InMemoryVectorDB(embedding_dim=384)
    # Add a mock document that has "Paris" to ground the query
    chunks = ["The capital of France is Paris. It is a beautiful city."]
    embeddings = [np.random.rand(384)]
    db.add_documents(embeddings, chunks)
    return db

def run_benchmark(num_queries=100):
    print(f"Running benchmark for {num_queries} queries...")
    db = setup_mock_db()
    
    pipeline = RagPipelineOrchestrator(
        stt_provider=MockSTT(),
        vector_db=db,
        embedder=MockEmbedder(),
        llm_client=MockLLM()
    )
    
    latencies = []
    for i in range(num_queries):
        result = pipeline.run_pipeline(b"fake audio data")
        latencies.append(result["metrics"]["total_pipeline_latency_ms"])
        
    latencies = np.array(latencies)
    p50 = np.percentile(latencies, 50)
    p70 = np.percentile(latencies, 70)
    p100 = np.percentile(latencies, 100)
    
    print("\n--- Latency Analytics ---")
    print(f"Total Queries: {num_queries}")
    print(f"P50 Latency:  {p50:.2f} ms")
    print(f"P70 Latency:  {p70:.2f} ms")
    print(f"P100 Latency: {p100:.2f} ms")
    
    if p100 < 200:
        print("✅ SUCCESS: Pipeline completes under 200ms target.")
    else:
        print("❌ WARNING: Pipeline exceeds 200ms target.")

if __name__ == "__main__":
    run_benchmark()
