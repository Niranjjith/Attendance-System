import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class AuthApi {
  static Future<Map<String, dynamic>> login(String userId, String password) async {
    final response = await ApiService.post('/auth/login', {
      'userId': userId,
      'password': password,
    });

    if (response['token'] != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', response['token']);
      await prefs.setString('user', jsonEncode(response['user']));
    }

    return response;
  }

  static Future<void> logout() async {
    try {
      await ApiService.post('/auth/logout', {});
    } catch (e) {
      // Ignore errors on logout
    } finally {
      await ApiService.logout();
    }
  }

  static Future<Map<String, dynamic>> getMe() async {
    return await ApiService.get('/auth/me');
  }
}

