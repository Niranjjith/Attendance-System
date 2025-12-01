class User {
  final String id;
  final String userId;
  final String name;
  final String? email;
  final String role;
  final String? batch;

  User({
    required this.id,
    required this.userId,
    required this.name,
    this.email,
    required this.role,
    this.batch,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? json['_id'] ?? '',
      userId: json['userId'] ?? '',
      name: json['name'] ?? '',
      email: json['email'],
      role: json['role'] ?? '',
      batch: json['batch'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'name': name,
      'email': email,
      'role': role,
      'batch': batch,
    };
  }
}

