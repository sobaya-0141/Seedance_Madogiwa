import 'package:flame_3d/graphics.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:madogiwa_voxel_mobile/app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations(const [
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  await GpuBackend.initialize();
  runApp(const MadogiwaVoxelApp());
}
