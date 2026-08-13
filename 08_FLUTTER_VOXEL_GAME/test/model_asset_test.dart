import 'package:flame_3d/parser.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('canonical sobaya GLB exposes the reusable voxel rig', () async {
    final model = await ModelParser.parse('models/sobaya.glb');

    expect(model.nodeNames, contains('VoxelRig_ArmPrimary'));
    expect(model.nodeNames, contains('VoxelRig_ArmSecondary'));
    expect(model.nodeNames, contains('VoxelRig_LegLeft'));
    expect(model.nodeNames, contains('VoxelRig_LegRight'));
    expect(model.nodeNames, contains('VoxelRig_PrimaryHandSocket'));
    expect(model.animationNames, contains('Idle'));
  });
}
