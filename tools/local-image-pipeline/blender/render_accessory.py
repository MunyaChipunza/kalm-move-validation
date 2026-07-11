#!/usr/bin/env python3
import argparse
import json
import sys
from pathlib import Path

import bpy

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.append(str(SCRIPT_DIR))
from build_accessory_scene import BUILDERS, appliance_silhouette, clear_scene, ground
from camera import create_camera
from lighting import premium_lighting


def args_after_dash():
    raw = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--product-id", required=True)
    parser.add_argument("--view", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--definitions", default=str(SCRIPT_DIR / "product_definitions.json"))
    return parser.parse_args(raw)


def render(product, view, output):
    clear_scene()
    lifestyle = view in {"lifestyle-use", "compatible-appliance"}
    ground(lifestyle)
    object_ = BUILDERS[product["kind"]]()
    if view == "opposite-side":
        object_.rotation_euler[2] = 2.65
    elif view == "component-layout":
        object_.rotation_euler[2] = 0.45
    elif view == "material-detail":
        object_.scale = (1.35, 1.35, 1.35)
    elif view == "compatible-appliance":
        object_.location = (0, -0.55, 0.38)
        appliance_silhouette(product["family"])
    elif view == "lifestyle-use":
        object_.location = (0, -0.35, 0.62)
        object_.rotation_euler[2] = -0.25
    target = object_.location.copy()
    if view == "material-detail":
        camera = create_camera((2.3, -2.3, 1.9), target=(0, 0, 0.15), lens=82)
    elif view in {"lifestyle-use", "compatible-appliance"}:
        camera = create_camera((3.6, -5.2, 3.4), target=(0, 0.30, 0.62), lens=56)
    else:
        camera = create_camera((3.4, -4.7, 2.8), target=(0, 0, 0.28), lens=62)
    premium_lighting(target)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 1500
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.quality = 92
    scene.render.film_transparent = False
    scene.render.filepath = str(Path(output).resolve())
    scene.world.color = (0.03, 0.025, 0.02)
    scene.render.image_settings.color_mode = "RGB"
    Path(output).parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    options = args_after_dash()
    definitions = json.loads(Path(options.definitions).read_text(encoding="utf-8"))
    selected = next(item for item in definitions["products"] if item["id"] == options.product_id)
    render(selected, options.view, options.output)
