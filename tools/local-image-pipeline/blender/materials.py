import bpy


def material(name, color, metallic=0.0, roughness=0.45):
    existing = bpy.data.materials.get(name)
    if existing:
        return existing
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


def palette():
    return {
        "steel": material("brushed-steel", (0.24, 0.28, 0.30, 1), 0.88, 0.24),
        "black": material("powder-black", (0.009, 0.012, 0.014, 1), 0.15, 0.31),
        "iron": material("cast-iron", (0.018, 0.016, 0.014, 1), 0.8, 0.5),
        "wood": material("hardwood", (0.20, 0.075, 0.025, 1), 0.0, 0.38),
        "silicone": material("silicone", (0.05, 0.06, 0.06, 1), 0.0, 0.62),
        "textile": material("heat-textile", (0.025, 0.032, 0.028, 1), 0.0, 0.7),
        "display": material("blank-display", (0.004, 0.011, 0.013, 1), 0.35, 0.16),
        "stone": material("stone", (0.15, 0.12, 0.09, 1), 0.0, 0.82),
        "warm": material("warm-studio", (0.16, 0.13, 0.10, 1), 0.0, 0.75),
    }
