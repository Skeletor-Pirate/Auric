import faiss
import numpy as np

class InMemoryVectorDB:
    def __init__(self, embedding_dim=384):
        # Using L2 distance FAISS index for high-speed local retrieval
        self.index = faiss.IndexFlatL2(embedding_dim)
        self.documents = [] # Maps index to text chunk
    
    def add_documents(self, embeddings, chunks):
        """Add embeddings and their corresponding text chunks to the DB."""
        if len(embeddings) != len(chunks):
            raise ValueError("Embeddings and chunks must have the same length.")
        
        embeddings_np = np.array(embeddings).astype('float32')
        self.index.add(embeddings_np)
        self.documents.extend(chunks)
        
    def search(self, query_embedding, top_k=3):
        """Search the DB and return the top_k matching chunks."""
        query_np = np.array([query_embedding]).astype('float32')
        distances, indices = self.index.search(query_np, top_k)
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx != -1 and idx < len(self.documents):
                results.append({
                    "chunk": self.documents[idx],
                    "score": dist
                })
        return results
