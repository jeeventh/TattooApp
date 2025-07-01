# 🖥️ StarVector CPU Hosting Guide

This guide shows you how to run StarVector locally on your laptop **without a dedicated GPU** for testing purposes.

## ✅ Is CPU Hosting Right for You?

### **Requirements Check:**
- **StarVector-1B**: 8GB+ RAM, 30-60 seconds per SVG
- **StarVector-8B**: 24GB+ RAM, 2-5 minutes per SVG
- **Python 3.8+** installed
- **Patience** (CPU inference is slow but works!)

### **What You Get:**
✅ **Real StarVector models** running locally  
✅ **No API dependencies** or costs  
✅ **Full control** over the inference process  
✅ **Perfect for testing** your app integration  
⚠️ **Slow performance** (but functional)

## 🚀 Quick Setup (5 Steps)

### 1. **Install Python Dependencies**
```bash
# Create virtual environment (recommended)
python -m venv starvector_env
source starvector_env/bin/activate  # On Windows: starvector_env\Scripts\activate

# Install dependencies
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install transformers accelerate pillow flask
pip install huggingface_hub
```

### 2. **Clone StarVector Repository**
```bash
# Clone the official StarVector repo
git clone https://github.com/joanrod/star-vector.git
cd star-vector

# Install StarVector
pip install -e .
```

### 3. **Start CPU Server**
```bash
# For StarVector-1B (recommended for laptops)
python scripts/start_cpu_server.py --model 1b

# For StarVector-8B (if you have 24GB+ RAM)
python scripts/start_cpu_server.py --model 8b

# Custom port (if needed)
python scripts/start_cpu_server.py --model 1b --port 8001
```

### 4. **Enable CPU Mode in Your App**
Update your `src/constants/aiConfig.ts`:
```typescript
export const AI_CONFIG: AIConfig = {
    // ... your existing config
    huggingFace: 'your_token_here',
};

// Enable CPU mode for testing
export const ENABLE_CPU_STARVECTOR = true;
```

### 5. **Test the Integration**
1. Start your React Native app: `npm start`
2. Navigate to Design Capture screen
3. Take a photo - you should see "🖥️ Using local CPU StarVector server..."
4. Wait 30-60 seconds for processing
5. Get your SVG result!

## 📊 Performance Expectations

| Configuration | Model Load Time | SVG Generation | Quality |
|---|---|---|---|
| **1B + 8GB RAM** | 2-5 minutes | 30-60 seconds | ⭐⭐⭐⭐ |
| **1B + 16GB RAM** | 1-2 minutes | 20-40 seconds | ⭐⭐⭐⭐ |
| **8B + 24GB RAM** | 5-10 minutes | 2-5 minutes | ⭐⭐⭐⭐⭐ |
| **8B + 32GB RAM** | 3-5 minutes | 1-3 minutes | ⭐⭐⭐⭐⭐ |

## 🔧 Optimization Tips

### **Speed Up Loading:**
```bash
# Pre-download models to avoid waiting
huggingface-cli download starvector/starvector-1b-im2svg
huggingface-cli download starvector/starvector-8b-im2svg
```

### **Memory Optimization:**
```python
# In the server script, you can add:
import torch
torch.set_num_threads(1)  # Use single thread for CPU
torch.backends.quantized.engine = 'qnnpack'  # Optimize for mobile CPUs
```

### **Reduce Wait Time:**
```python
# Smaller max_tokens for faster generation
max_tokens = 1024  # Instead of 2048
```

## 🐛 Troubleshooting

### **"Model download failed"**
```bash
# Login to HuggingFace first
huggingface-cli login
# Then try again
```

### **"Out of memory"**
- Use StarVector-1B instead of 8B
- Close other applications
- Increase system swap file

### **"Server not starting"**
```bash
# Check if port is available
netstat -an | findstr :8000

# Use different port
python scripts/start_cpu_server.py --model 1b --port 8001
```

### **"App can't connect"**
- Make sure server shows "✅ Server ready!"
- Test health check: http://localhost:8000/health
- Check firewall settings

## 📱 App Integration

Your app is already configured to work with local CPU StarVector! Here's what happens:

1. **App checks** for local StarVector server
2. **If available**: Uses real StarVector models (slow but real!)
3. **If not available**: Falls back to enhanced local processing (fast)
4. **User experience**: Seamless, they get quality results either way

### **Enable CPU Mode Manually:**
```typescript
// In your screen where you process images
const options: ProcessingOptions = {
    useCPUMode: true,        // Enable CPU StarVector
    starVectorModel: '1b',   // Use 1B for speed
    fallbackToLocal: true,   // Fallback if server down
};
```

## 🎯 Recommended Approach

### **For Development/Testing:**
1. ✅ **Use StarVector-1B on CPU** (functional, reasonable wait times)
2. ✅ **Keep your excellent fallback system** 
3. ✅ **Test real StarVector capabilities**
4. ✅ **Validate the full integration**

### **For Production:**
1. Consider cloud hosting for real-time performance
2. Your current fallback system is production-ready
3. Add CPU StarVector as "Premium Processing" option

## 🌟 Next Steps

Once you have CPU hosting working:

### **Test Different Models:**
```bash
# Quick comparison
python scripts/start_cpu_server.py --model 1b --port 8000 &
python scripts/start_cpu_server.py --model 8b --port 8001 &
```

### **Profile Performance:**
- Monitor RAM usage during inference
- Test with different image sizes
- Compare quality vs. speed trade-offs

### **Consider Cloud Upgrade:**
- Google Colab Pro for GPU testing
- Modal.com for production hosting
- HuggingFace Spaces for custom deployment

## 💡 Summary

**CPU hosting StarVector is definitely possible and practical for testing!** You'll get:

✅ **Real StarVector results** (just slower)  
✅ **Complete local control**  
✅ **Perfect for validating your app**  
✅ **No ongoing costs**  

The 30-60 second wait time is reasonable for testing, and your users will still get the excellent fallback processing for day-to-day use.

**Ready to start?** Run the setup commands above and you'll have real StarVector running locally in about 10 minutes! 🚀 