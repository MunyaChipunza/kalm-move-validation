import bpy


def add_area(name, location, energy, size, color=(1.0, 0.87, 0.72)):
    data = bpy.data.lights.new(name, type="AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    data.color = color
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    return obj


def point_at(obj, target):
    direction = target - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def premium_lighting(target):
    key = add_area("soft-key", (4.5, -4.5, 6.5), 1050, 5.5)
    fill = add_area("soft-fill", (-4.0, -2.0, 3.0), 420, 4.0, (0.72, 0.82, 1.0))
    rim = add_area("soft-rim", (1.0, 4.2, 5.0), 760, 3.0, (1.0, 0.64, 0.38))
    for light in (key, fill, rim):
        point_at(light, target)
