from PIL import Image
import os

def optimize_icon():
    source_path = 'assets/images/icon.png'
    try:
        img = Image.open(source_path)
        original_size = os.path.getsize(source_path) / 1024
        print(f"Original Icon Size: {original_size:.2f} KB")

        # Apple recommends < 200KB if possible, but 800KB is risky.
        # We target quality 85 which usually drops size significantly for PNG.
        # However, PIL PNG optimization is limited. We can try reducing colors slightly or using optimization flags.
        
        # Ensure RGB 1024x1024
        if img.mode != 'RGB':
            img = img.convert('RGB')
        if img.size != (1024, 1024):
            img = img.resize((1024, 1024), Image.Resampling.LANCZOS)
            
        # User wants 100/100 on iOS Config, which requires RGB.
        # We try RGB with maximum compression.
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        # Save with optimization
        img.save(source_path, 'PNG', optimize=True, compress_level=9)
        
        new_size = os.path.getsize(source_path) / 1024
        print(f"Optimized Icon Size (RGB): {new_size:.2f} KB")
        
    except Exception as e:
        print(f"Error optimizing icon: {e}")

def fix_splash():
    source_path = 'assets/images/splash-icon.png'
    try:
        img = Image.open(source_path)
        print(f"Splash Mode: {img.mode}")
        
        # Force RGB (24-bit) instead of P (Palette 8-bit)
        if img.mode != 'RGB':
            print("Converting splash to RGB...")
            img = img.convert('RGB')
            img.save(source_path, 'PNG')
            print("Splash converted to RGB.")
        else:
            print("Splash is already RGB.")
            
    except Exception as e:
        print(f"Error fixing splash: {e}")

if __name__ == "__main__":
    optimize_icon()
    fix_splash()
