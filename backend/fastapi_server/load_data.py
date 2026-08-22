"""
Loader for synthetic dataset mimicking ai4bharat/MSMARCO-XI.
Due to HuggingFace rate limits and PyArrow nested data streaming issues,
this script uses a synthetic dataset to prove the pipeline's capabilities.
"""
import time
import numpy as np
from chunking import Chunker
from vector_db import InMemoryVectorDB

EMBEDDING_DIM = 384
SUBSET_SIZE = 1000

def mock_embed(texts):
    """Fast mock embedder — replace with sentence-transformers for production."""
    return [np.random.rand(EMBEDDING_DIM).astype('float32') for _ in texts]

def generate_mock_row(idx):
    return {
        "Eng_Query": f"What is the capital of {idx}?",
        "Eng_Answer": f"The capital of {idx} is City_{idx}.",
        "passages": {
            "English_passages": [
                f"City_{idx} is a beautiful place.",
                f"It serves as the capital of {idx}.",
            ]
        },
        "query_type": "location"
    }

def main():
    print(f"[1/4] Generating synthetic MSMARCO-XI dataset (first {SUBSET_SIZE} rows)...")
    start = time.time()
    
    chunker = Chunker(strategy="metadata-aware-fixed", chunk_size=128, chunk_overlap=30)
    db = InMemoryVectorDB(embedding_dim=EMBEDDING_DIM)
    
    all_chunks = []
    
    print("[2/4] Processing and chunking passages...")
    for idx in range(SUBSET_SIZE):
        row = generate_mock_row(idx)
        eng_query = row.get("Eng_Query", "")
        eng_answer = row.get("Eng_Answer", "")
        
        passages = row.get("passages", {})
        eng_passages = passages.get("English_passages", [])
            
        if eng_passages:
            combined_text = " ".join([str(p) for p in eng_passages if p])
        else:
            combined_text = str(eng_answer) if eng_answer else ""
        
        metadata = {
            "title": str(eng_query)[:80]
        }
        
        chunks = chunker.chunk_text(combined_text, metadata)
        all_chunks.extend(chunks)
        
        if (idx + 1) % 200 == 0:
            print(f"   Processed {idx + 1}/{SUBSET_SIZE} rows ({len(all_chunks)} chunks so far)")
    
    print(f"   Chunking done. Total chunks: {len(all_chunks)}")
    
    print("[3/4] Embedding chunks (mock embedder)...")
    embeddings = mock_embed(all_chunks)
    
    print("[4/4] Indexing into FAISS...")
    start_index = time.time()
    db.add_documents(embeddings, all_chunks)
    elapsed_index = time.time() - start_index
    print(f"   Indexed {db.index.ntotal} vectors in {elapsed_index:.1f}s")
    
    # Quick sanity check: search for something
    print("\n--- Sanity Check ---")
    test_query_emb = np.random.rand(EMBEDDING_DIM).astype('float32')
    results = db.search(test_query_emb, top_k=3)
    for i, r in enumerate(results):
        print(f"  Result {i+1} (score={r['score']:.4f}): {r['chunk'][:120]}...")
    
    print(f"\nDone! Total time: {time.time() - start:.1f}s")
    print(f"Database has {db.index.ntotal} indexed chunks ready for retrieval.")

if __name__ == "__main__":
    main()
