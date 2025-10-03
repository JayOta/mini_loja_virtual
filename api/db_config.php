<?php
// Define as constantes de conexão com o banco de dados
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'mini_loja');

// Removemos a linha '$pdo = null;'

try {
    // Cria e inicializa a variável $pdo
    $pdo = new PDO( 
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_OBJ, 
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    // Se a conexão falhar, interrompe o script
    http_response_code(500);
    // ... (restante do bloco de erro)
    die(json_encode([
        'success' => false,
        'message' => 'Erro na conexão com o banco de dados: ' . $e->getMessage()
    ]));
}

// O $pdo agora está garantidamente um objeto PDO se o script chegou até aqui.