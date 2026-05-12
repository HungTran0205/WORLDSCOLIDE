import cv2
import numpy as np
import os
import argparse

def split_tileset(image_path, output_dir):
    print(f"Processing {image_path}...")
    # Load the image with alpha channel
    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    
    if img is None:
        print(f"Error: Could not load image {image_path}")
        return

    # Check if image has an alpha channel
    if img.shape[2] == 4:
        # Extract the alpha channel
        alpha_channel = img[:, :, 3]
        # Threshold the alpha channel (0 is transparent, >0 is opaque)
        _, mask = cv2.threshold(alpha_channel, 128, 255, cv2.THRESH_BINARY)
    else:
        print(f"Image {image_path} does not have an alpha channel. Assuming white background.")
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Threshold (assuming white background, so invert it)
        _, mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)

    # Find contours
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    print(f"Found {len(contours)} potential tiles.")

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    base_name = os.path.splitext(os.path.basename(image_path))[0]
    count = 0

    # Sort contours from top to bottom, left to right
    # Calculate bounding boxes
    bounding_boxes = [cv2.boundingRect(c) for c in contours]
    
    # Filter out very small noise contours (e.g., smaller than 10x10)
    bounding_boxes = [b for b in bounding_boxes if b[2] > 10 and b[3] > 10]
    
    # Sort by Y first (with a tolerance), then X
    # Group by rows: if Y difference is small, consider same row
    bounding_boxes.sort(key=lambda b: (b[1] // 50, b[0])) 

    print(f"Extracting {len(bounding_boxes)} tiles after filtering small noise...")

    for i, (x, y, w, h) in enumerate(bounding_boxes):
        # Extract the tile
        tile = img[y:y+h, x:x+w]
        
        # Save the tile
        output_path = os.path.join(output_dir, f"{base_name}_tile_{i:03d}.png")
        cv2.imwrite(output_path, tile)
        count += 1

    print(f"Successfully extracted {count} tiles to {output_dir}\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Split tileset into individual tiles based on transparency.")
    parser.add_argument("image_paths", nargs='+', help="Paths to the tileset images")
    parser.add_argument("--out", default=".", help="Output directory")
    
    args = parser.parse_args()
    
    for img_path in args.image_paths:
        output_folder = os.path.join(args.out, os.path.splitext(os.path.basename(img_path))[0])
        split_tileset(img_path, output_folder)
