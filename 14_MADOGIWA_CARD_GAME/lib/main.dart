import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:marionette_flutter/marionette_flutter.dart';

import 'app.dart';
import 'automation/marionette_extensions.dart';

void main() {
  if (kDebugMode && !kIsWeb) {
    MarionetteBinding.ensureInitialized();
    registerMadogiwaMarionetteExtensions();
  } else {
    WidgetsFlutterBinding.ensureInitialized();
  }
  runApp(const MadogiwaGridApp());
}
