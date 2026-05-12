import cv2
import numpy as np
import os
import argparse

def split_by_edges(image_path, output_dir):
    print(f"Processing {image_path} with Canny Edge Detection...")
    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    
    if img is None:
        print(f"Error: Could not load image {image_path}")
        return

    # Convert to grayscale
    if len(img.shape) == 3 and img.shape[2] == 4:
        # If it has alpha, maybe just use BGR part
        gray = cv2.cvtColor(img[:,:,:3], cv2.COLOR_BGR2GRAY)
    elif len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img

    # Blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Canny Edge Detection
    edges = cv2.Canny(blurred, 50, 150)

    # Dilate the edges to connect them
    kernel = np.ones((5,5), np.uint8)
    dilated = cv2.dilate(edges, kernel, iterations=3)

    # Find contours
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    print(f"Found {len(contours)} potential tiles.")

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    base_name = os.path.splitext(os.path.basename(image_path))[0]
    count = 0

    bounding_boxes = [cv2.boundingRect(c) for c in contours]
    bounding_boxes = [b for b in bounding_boxes if b[2] > 30 and b[3] > 30]
    
    bounding_boxes.sort(key=lambda b: (b[1] // 100, b[0])) 

    print(f"Extracting {len(bounding_boxes)} tiles after filtering small noise...")

    # Optional: We want to extract from the original image (with alpha if we use the rmbg one)
    # But let's use the original image without rmbg, since rmbg failed for the second one
    # Wait, the edges might be connected to the border. Let's see.

    for i, (x, y, w, h) in enumerate(bounding_boxes):
        # Add some padding
        pad = 5
        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(img.shape[1], x + w + pad)
        y2 = min(img.shape[0], y + h + pad)
        
        tile = img[y1:y2, x1:x2]
        
        output_path = os.path.join(output_dir, f"{base_name}_edge_{i:03d}.png")
        cv2.imwrite(output_path, tile)
        count += 1

    print(f"Successfully extracted {count} tiles to {output_dir}\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("image_paths", nargs='+', help="Paths to images")
    parser.add_argument("--out", default=".", help="Output directory")
    args = parser.parse_args()
    
    for img_path in args.image_paths:
        output_folder = os.path.join(args.out, os.path.splitext(os.path.basename(img_path))[0])
        split_by_edges(img_path, output_folder)
