import bpy
from math import radians
from mathutils import Vector

from materials import palette


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for datablock in list(collection):
            if datablock.users == 0:
                collection.remove(datablock)


def finish(obj, mat, bevel=0.04):
    obj.data.materials.append(mat)
    if bevel:
        modifier = obj.modifiers.new("edge-softness", "BEVEL")
        modifier.width = bevel
        modifier.segments = 3
    return obj


def cube(name, location, scale, mat, bevel=0.04):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, mat, bevel)


def cylinder(name, location, radius, depth, mat, rotation=(0, 0, 0), bevel=0.025):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    return finish(obj, mat, bevel)


def sphere(name, location, scale, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, mat, 0.015)


def join(parts, name="accessory"):
    bpy.ops.object.select_all(action="DESELECT")
    for part in parts:
        part.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    parts[0].name = name
    return parts[0]


def add_perforations(body, z=0.07):
    dots = []
    for x in (-0.45, -0.15, 0.15, 0.45):
        for y in (-0.24, 0, 0.24):
            dots.append(cylinder("perforation", (x, y, z), 0.035, 0.006, palette()["black"], bevel=0.005))
    return dots


def launch_peel():
    p = palette(); parts = [cube("peel", (0, 0, 0.09), (0.95, 0.52, 0.035), p["steel"]), cylinder("handle", (0, -1.05, 0.09), 0.065, 1.2, p["wood"], rotation=(radians(90), 0, 0))]
    parts += add_perforations(parts[0])
    return join(parts)


def turning_peel():
    p = palette(); parts = [cylinder("round-head", (0, 0.22, 0.09), 0.48, 0.035, p["steel"]), cylinder("handle", (0, -1.05, 0.09), 0.05, 1.35, p["wood"], rotation=(radians(90), 0, 0))]
    return join(parts)


def dough_heat():
    p = palette(); parts = [cube("board", (0, 0, 0.08), (0.92, 0.58, 0.05), p["wood"]), cylinder("dough-tool", (-0.34, 0.08, 0.19), 0.09, 0.5, p["steel"], rotation=(0, radians(90), 0)), cylinder("temperature-tool", (0.34, 0.05, 0.19), 0.06, 0.5, p["black"], rotation=(0, radians(90), 0)), cylinder("dough-ball", (0.0, -0.2, 0.17), 0.15, 0.08, p["silicone"])]
    return join(parts)


def temperature():
    p = palette(); parts = [cube("control", (0, 0, 0.21), (0.45, 0.32, 0.18), p["black"]), cube("blank-display", (0, -0.33, 0.25), (0.27, 0.012, 0.10), p["display"], 0.01), cylinder("probe", (0.75, 0, 0.12), 0.035, 0.95, p["steel"], rotation=(0, radians(90), 0)), cylinder("case", (-0.72, 0.0, 0.10), 0.19, 0.08, p["silicone"])]
    return join(parts)


def rotisserie():
    p = palette(); parts = [cylinder("spit", (0, 0, 0.52), 0.025, 2.5, p["steel"], rotation=(0, radians(90), 0)), cube("motor", (-1.28, 0, 0.50), (0.18, 0.18, 0.18), p["black"]), cube("bracket", (1.20, 0, 0.35), (0.06, 0.16, 0.35), p["steel"]), cylinder("fork-a", (-0.28, 0, 0.52), 0.075, 0.04, p["steel"], rotation=(radians(90), 0, 0)), cylinder("fork-b", (0.28, 0, 0.52), 0.075, 0.04, p["steel"], rotation=(radians(90), 0, 0))]
    return join(parts)


def sear_plate():
    p = palette(); parts = [cube("sear-plate", (0, 0, 0.10), (0.95, 0.62, 0.08), p["iron"])]
    for x in (-0.65, -0.4, -0.15, 0.1, 0.35, 0.6):
        parts.append(cube("grill-rib", (x, 0, 0.20), (0.055, 0.53, 0.018), p["iron"], 0.01))
    return join(parts)


def tool_roll():
    p = palette(); parts = [cube("tool-roll", (0, 0, 0.10), (0.92, 0.56, 0.07), p["textile"])]
    for x in (-0.48, -0.16, 0.16, 0.48):
        parts.append(cylinder("tool", (x, 0.05, 0.22), 0.035, 0.82, p["steel"], rotation=(0, radians(90), 0)))
    return join(parts)


def smash_steam():
    p = palette(); parts = [cylinder("press", (-0.34, 0, 0.14), 0.34, 0.10, p["steel"]), cylinder("press-handle", (-0.34, 0, 0.35), 0.07, 0.34, p["wood"]), sphere("steam-dome", (0.43, 0, 0.20), (0.43, 0.43, 0.25), p["steel"]), cylinder("dome-knob", (0.43, 0, 0.48), 0.06, 0.12, p["black"])]
    return join(parts)


def season_care():
    p = palette(); parts = [cube("care-case", (0, 0, 0.10), (0.78, 0.48, 0.08), p["textile"]), cube("scraper", (-0.35, 0.05, 0.24), (0.08, 0.36, 0.02), p["steel"]), cylinder("applicator", (0.28, 0.08, 0.22), 0.10, 0.38, p["wood"], rotation=(0, radians(90), 0)), cube("neutral-tin", (0.28, -0.28, 0.21), (0.17, 0.13, 0.10), p["black"])]
    return join(parts)


BUILDERS = {"launch_peel": launch_peel, "turning_peel": turning_peel, "dough_heat": dough_heat, "temperature": temperature, "rotisserie": rotisserie, "sear_plate": sear_plate, "tool_roll": tool_roll, "smash_steam": smash_steam, "season_care": season_care}


def appliance_silhouette(family):
    p = palette()
    if family == "ember":
        cube("ember-body", (0, 1.35, 0.65), (1.15, 0.45, 0.65), p["black"])
        cube("ember-door", (0, 0.88, 0.65), (0.54, 0.02, 0.26), p["steel"])
    elif family == "ridge":
        cube("ridge-body", (0, 1.35, 0.70), (1.22, 0.48, 0.70), p["steel"])
        cube("ridge-lid", (0, 0.88, 1.22), (1.0, 0.05, 0.16), p["black"])
    else:
        cube("forge-plate", (0, 1.35, 0.72), (1.25, 0.55, 0.10), p["iron"])
        cube("forge-legs", (0, 1.35, 0.28), (1.10, 0.42, 0.05), p["black"])


def ground(lifestyle=False):
    p = palette()
    cube("floor", (0, 0, -0.08), (7, 7, 0.06), p["stone"] if lifestyle else p["warm"], 0.0)
    if lifestyle:
        cube("counter", (0, 0.55, 0.35), (2.9, 1.3, 0.22), p["stone"], 0.02)
        cube("timber-backdrop", (0, 3.5, 2.2), (4.5, 0.08, 2.5), p["wood"], 0.0)
