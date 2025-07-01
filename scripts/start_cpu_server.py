#!/usr/bin/env python3
"""
StarVector CPU Server for Local Testing
=====================================

This script runs StarVector models locally on CPU for testing the 
tattoo app integration. It's designed for development/testing only.

Requirements:
- 8GB+ RAM for StarVector-1B
- 24GB+ RAM for StarVector-8B
- Python 3.8+
- PyTorch, Transformers, StarVector

Usage:
    python scripts/start_cpu_server.py --model 1b
    python scripts/start_cpu_server.py --model 8b --port 8001
"""

import argparse
import base64
import io
import json
import logging
import time
from typing import Optional

try:
    import torch
    from transformers import AutoModelForCausalLM, AutoProcessor
    from PIL import Image
    from flask import Flask, request, jsonify
    HAS_DEPENDENCIES = True
except ImportError as e:
    print(f"❌ Missing dependencies: {e}")
    print("📦 Install with: pip install torch transformers pillow flask")
    HAS_DEPENDENCIES = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StarVectorCPUServer:
    def __init__(self, model_size: str = "1b", device: str = "cpu"):
        """Initialize StarVector CPU server."""
        self.model_size = model_size
        self.device = device
        self.model = None
        self.processor = None
        self.model_name = f"starvector/starvector-{model_size}-im2svg"
        
        logger.info(f"🔧 Initializing StarVector CPU Server")
        logger.info(f"📊 Model: {self.model_name}")
        logger.info(f"🖥️ Device: {device}")
        
    def load_model(self):
        """Load StarVector model for CPU inference."""
        try:
            logger.info(f"📥 Loading {self.model_name}...")
            start_time = time.time()
            
            # Load model with CPU optimizations
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                torch_dtype=torch.float32,  # Use float32 for CPU
                device_map="cpu",
                trust_remote_code=True,
                low_cpu_mem_usage=True,
            )
            
            # Get processor
            self.processor = self.model.model.processor
            
            load_time = time.time() - start_time
            logger.info(f"✅ Model loaded in {load_time:.1f}s")
            logger.info(f"💾 Model parameters: {self.model.num_parameters():,}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            return False
    
    def generate_svg(self, image_base64: str, max_tokens: int = 2048, temperature: float = 0.1) -> Optional[str]:
        """Generate SVG from base64 image."""
        try:
            logger.info("🎨 Generating SVG from image...")
            start_time = time.time()
            
            # Decode base64 image
            image_data = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(image_data))
            
            # Process image
            inputs = self.processor(image, return_tensors="pt")
            pixel_values = inputs['pixel_values']
            
            if pixel_values.shape[0] != 1:
                pixel_values = pixel_values.squeeze(0)
            
            batch = {"image": pixel_values}
            
            # Generate SVG (CPU inference will be slow)
            logger.info("⏳ Generating SVG... (this may take 30-120 seconds on CPU)")
            
            with torch.no_grad():
                svg_code = self.model.generate_im2svg(
                    batch, 
                    max_length=max_tokens,
                    temperature=temperature,
                    do_sample=True
                )[0]
            
            generation_time = time.time() - start_time
            logger.info(f"✅ SVG generated in {generation_time:.1f}s")
            
            return svg_code
            
        except Exception as e:
            logger.error(f"❌ SVG generation failed: {e}")
            return None

# Flask app
app = Flask(__name__)
server = None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    global server
    if server and server.model:
        return jsonify({"status": "ready", "model": server.model_name}), 200
    else:
        return jsonify({"status": "loading"}), 503

@app.route('/generate', methods=['POST'])
def generate_svg():
    """Generate SVG from image."""
    global server
    
    try:
        if not server or not server.model:
            return jsonify({"error": "Model not loaded"}), 503
        
        data = request.json
        image_base64 = data.get('image')
        max_tokens = data.get('max_tokens', 2048)
        temperature = data.get('temperature', 0.1)
        
        if not image_base64:
            return jsonify({"error": "No image provided"}), 400
        
        # Generate SVG
        svg_code = server.generate_svg(image_base64, max_tokens, temperature)
        
        if svg_code:
            return jsonify({
                "svg_code": svg_code,
                "model": server.model_name,
                "device": server.device
            }), 200
        else:
            return jsonify({"error": "SVG generation failed"}), 500
            
    except Exception as e:
        logger.error(f"❌ Request failed: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/info', methods=['GET'])
def model_info():
    """Get model information."""
    global server
    if server:
        return jsonify({
            "model": server.model_name,
            "device": server.device,
            "loaded": server.model is not None,
        }), 200
    else:
        return jsonify({"error": "Server not initialized"}), 503

def main():
    """Main function."""
    global server
    
    if not HAS_DEPENDENCIES:
        print("❌ Missing required dependencies")
        return
    
    parser = argparse.ArgumentParser(description="StarVector CPU Server")
    parser.add_argument('--model', choices=['1b', '8b'], default='1b', 
                       help='Model size (1b for faster, 8b for better quality)')
    parser.add_argument('--port', type=int, default=8000, 
                       help='Server port (default: 8000)')
    parser.add_argument('--host', default='localhost', 
                       help='Server host (default: localhost)')
    
    args = parser.parse_args()
    
    # System requirements check
    if args.model == '1b':
        print("💻 StarVector-1B Requirements:")
        print("   • RAM: 8GB+ recommended")
        print("   • Inference time: 30-60 seconds per image")
    else:
        print("💻 StarVector-8B Requirements:")
        print("   • RAM: 24GB+ recommended") 
        print("   • Inference time: 2-5 minutes per image")
    
    print(f"\n🚀 Starting StarVector CPU server...")
    print(f"📊 Model: starvector-{args.model}-im2svg")
    print(f"🌐 URL: http://{args.host}:{args.port}")
    print(f"⚠️  CPU inference is slow but works for testing")
    
    # Initialize server
    server = StarVectorCPUServer(model_size=args.model)
    
    # Load model
    if not server.load_model():
        print("❌ Failed to load model. Exiting.")
        return
    
    print(f"\n✅ Server ready!")
    print(f"🔗 Health check: http://{args.host}:{args.port}/health")
    print(f"📋 Model info: http://{args.host}:{args.port}/info")
    print(f"🎨 Generate SVG: POST to http://{args.host}:{args.port}/generate")
    print(f"\n📱 Your tattoo app can now use local StarVector!")
    
    # Start Flask server
    try:
        app.run(host=args.host, port=args.port, debug=False, threaded=True)
    except KeyboardInterrupt:
        print("\n👋 Server stopped")

if __name__ == "__main__":
    main() 