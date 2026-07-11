import bpy
from mathutils import Vector


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def create_camera(location, target=(0, 0, 0.55), lens=58):
    camera_data = bpy.data.cameras.new("Camera")
    camera_data.lens = lens
    camera_data.sensor_width = 36
    camera = bpy.data.objects.new("Camera", camera_data)
    bpy.context.collection.objects.link(camera)
    bpy.context.scene.camera = camera
    camera.location = location
    look_at(camera, target)
    return camera
