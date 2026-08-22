import numpy as np

class Chunker:
    def __init__(self, strategy="metadata-aware-fixed", chunk_size=256, chunk_overlap=50):
        self.strategy = strategy
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_text(self, text, metadata=None):
        if self.strategy == "metadata-aware-fixed":
            return self._metadata_aware_fixed(text, metadata)
        elif self.strategy == "semantic":
            return self._semantic_chunking(text, metadata)
        else:
            return self._basic_fixed(text)

    def _basic_fixed(self, text):
        words = text.split()
        chunks = []
        for i in range(0, len(words), self.chunk_size - self.chunk_overlap):
            chunks.append(" ".join(words[i:i + self.chunk_size]))
        return chunks

    def _metadata_aware_fixed(self, text, metadata):
        # Prefix metadata to ensure context isn't lost during retrieval
        prefix = ""
        if metadata:
            prefix = f"Context: {metadata.get('title', 'Unknown')} | "
        
        raw_chunks = self._basic_fixed(text)
        return [prefix + chunk for chunk in raw_chunks]

    def _semantic_chunking(self, text, metadata):
        # A mock semantic chunker splitting by sentences to simulate thought-boundary chunking
        import re
        sentences = re.split(r'(?<=[.!?]) +', text)
        chunks = []
        current_chunk = []
        current_len = 0
        for sentence in sentences:
            length = len(sentence.split())
            if current_len + length > self.chunk_size:
                chunks.append(" ".join(current_chunk))
                current_chunk = [sentence]
                current_len = length
            else:
                current_chunk.append(sentence)
                current_len += length
        if current_chunk:
            chunks.append(" ".join(current_chunk))
            
        if metadata:
            prefix = f"Context: {metadata.get('title', 'Unknown')} | "
            chunks = [prefix + c for c in chunks]
        return chunks
