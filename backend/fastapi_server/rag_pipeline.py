import time
import logging
from typing import Dict, Any, List

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RagPipelineOrchestrator:
    def __init__(self, stt_provider, vector_db, embedder, llm_client):
        self.stt_provider = stt_provider
        self.vector_db = vector_db
        self.embedder = embedder
        self.llm_client = llm_client
        
    def run_pipeline(self, audio_data: bytes) -> Dict[str, Any]:
        """
        Executes the entire RAG pipeline from audio to final text response.
        Enforces strict latency measurement.
        """
        metrics = {}
        
        # 1. Speech-to-Text
        start_stt = time.perf_counter()
        transcript = self._stt(audio_data)
        metrics["stt_latency_ms"] = (time.perf_counter() - start_stt) * 1000
        
        # Guardrail: Pre-Retrieval Safety Check
        if not self._is_safe(transcript):
            return {"answer": "I cannot answer this query due to safety guidelines.", "metrics": metrics}

        # 2. Embedding
        start_embed = time.perf_counter()
        query_embedding = self.embedder.embed(transcript)
        metrics["embed_latency_ms"] = (time.perf_counter() - start_embed) * 1000
        
        # 3. Retrieval
        start_retrieval = time.perf_counter()
        retrieved_chunks = self.vector_db.search(query_embedding, top_k=3)
        metrics["retrieval_latency_ms"] = (time.perf_counter() - start_retrieval) * 1000
        
        # 4. Generation with Guardrails (Grounding)
        start_gen = time.perf_counter()
        answer = self._generate_answer(transcript, retrieved_chunks)
        metrics["generation_latency_ms"] = (time.perf_counter() - start_gen) * 1000
        
        metrics["total_pipeline_latency_ms"] = sum(v for k, v in metrics.items() if "latency" in k)
        
        return {
            "query": transcript,
            "answer": answer,
            "retrieved_chunks": [c["chunk"] for c in retrieved_chunks],
            "metrics": metrics
        }
        
    def _stt(self, audio_data: bytes) -> str:
        # Placeholder for ElevenLabs/Sarvam API call
        # In a real implementation, this would use async httpx to the provider
        return self.stt_provider.transcribe(audio_data)
        
    def _is_safe(self, query: str) -> bool:
        # Lightweight safety check logic (e.g., regex or fast local classifier)
        unsafe_words = ["hack", "destroy", "illegal"]
        if any(w in query.lower() for w in unsafe_words):
            return False
        return True
        
    def _generate_answer(self, query: str, retrieved_chunks: List[Dict]) -> str:
        context_str = "\n".join([c["chunk"] for c in retrieved_chunks])
        
        # Strict grounding prompt
        prompt = f"""You are a helpful voice assistant.
Answer the user's question ONLY using the provided Context.
If the answer is not contained in the Context, you MUST say exactly: "I cannot answer this based on the provided context." Do not hallucinate.

Context:
{context_str}

User Question: {query}
Answer:"""

        # Call ultra-fast LLM (e.g., Groq Llama3 or Gemini Flash)
        return self.llm_client.generate(prompt)

# Mock implementations for testing latency analytics
class MockSTT:
    def transcribe(self, audio):
        # simulate some latency (e.g., 50ms)
        time.sleep(0.05)
        return "What is the capital of France?"

class MockEmbedder:
    def embed(self, text):
        time.sleep(0.01) # 10ms
        return [0.1] * 384 # 384 dim vector

class MockLLM:
    def generate(self, prompt):
        time.sleep(0.08) # 80ms inference for small models via Groq
        if "Paris" in prompt:
            return "The capital of France is Paris."
        return "I cannot answer this based on the provided context."
