import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../api/auth_api.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class AuthProvider with ChangeNotifier {
  User? _user;
  bool _isLoading = false;
  bool _isAuthenticated = false;

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;

  AuthProvider() {
    _loadUser();
  }

  Future<void> _loadUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString('user');
      if (userJson != null) {
        _user = User.fromJson(jsonDecode(userJson));
        _isAuthenticated = true;
        notifyListeners();
      }
    } catch (e) {
      print('Error loading user: $e');
    }
  }

  Future<bool> login(String userId, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await AuthApi.login(userId, password);
      _user = User.fromJson(response['user']);
      _isAuthenticated = true;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await AuthApi.logout();
    _user = null;
    _isAuthenticated = false;
    notifyListeners();
  }
}

