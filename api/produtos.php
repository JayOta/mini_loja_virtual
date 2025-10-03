<?php
// Configura o cabeçalho para retornar JSON e permitir CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

// Inclui a conexão com o banco de dados
include 'db_config.php';

// Obtém o método HTTP da requisição
$method = $_SERVER['REQUEST_METHOD'];

// Lógica de Roteamento (CRUD)
switch ($method) {
    case 'GET':
        // R: Read (Ler produtos)
        try {
            $stmt = $pdo->query("SELECT * FROM produtos ORDER BY id DESC");
            $produtos = $stmt->fetchAll();
            
            echo json_encode(['success' => true, 'data' => $produtos]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro ao buscar produtos: ' . $e->getMessage()]);
        }
        break;

    case 'POST':
        // C: Create (Criar novo produto) - AGORA TRATANDO UPLOAD (FormData)
        
        // O PHP recebe dados de texto via $_POST
        $nome = $_POST['nome'] ?? null;
        $preco = $_POST['preco'] ?? null;
        $estoque = $_POST['estoque'] ?? null;
        $descricao = $_POST['descricao'] ?? ''; // Campo opcional

        if (!$nome || !$preco || !$estoque) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Dados incompletos para cadastro.']);
            break;
        }

        // URL padrão, caso o upload falhe ou não haja arquivo
        $image_url_to_save = 'https://picsum.photos/400/300?random=' . time(); 

        // --- Lógica de Upload do Arquivo ---
        // 'imagem_arquivo' é o nome que definimos no formData.append('imagem_arquivo', ...) no JavaScript
        if (isset($_FILES['imagem_arquivo']) && $_FILES['imagem_arquivo']['error'] === UPLOAD_ERR_OK) {
            $file_tmp_path = $_FILES['imagem_arquivo']['tmp_name'];
            $file_name = $_FILES['imagem_arquivo']['name'];
            $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
            
            // Gerar um nome único para o arquivo
            $new_file_name = uniqid('prod_', true) . '.' . $file_ext;
            
            // Caminho de destino (../ volta da pasta 'api' para a raiz 'mini_loja_virtual')
            // CERTIFIQUE-SE DE QUE A PASTA 'img/produtos' EXISTE E TEM PERMISSÃO DE ESCRITA!
            $upload_dir = '../img/produtos/'; 
            $dest_path = $upload_dir . $new_file_name;

            // Tenta mover o arquivo temporário para o destino final
            if (move_uploaded_file($file_tmp_path, $dest_path)) {
                // Se o upload foi bem-sucedido, salva o caminho relativo no banco
                $image_url_to_save = 'img/produtos/' . $new_file_name; 
            } else {
                // Loga o erro, mas continua (usará o Picsum)
                error_log("Falha ao mover o arquivo de upload para: " . $dest_path);
            }
        }
        // --- Fim da Lógica de Upload ---

        try {
            $sql = "INSERT INTO produtos (nome, descricao, preco, estoque, imagem_url) VALUES (?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);

            $stmt->execute([
                $nome, 
                $descricao, 
                $preco, 
                $estoque,
                $image_url_to_save // Salva o caminho local ou o Picsum
            ]);
            
            echo json_encode(['success' => true, 'message' => 'Produto cadastrado com sucesso!', 'id' => $pdo->lastInsertId(), 'image_path' => $image_url_to_save]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro ao cadastrar produto: ' . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // D: Delete (Deletar produto)
        // ... (Seu código DELETE permanece o mesmo) ...
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID do produto inválida.']);
            break;
        }

        try {
            $sql = "DELETE FROM produtos WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$id]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => 'Produto deletado com sucesso.']);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Produto não encontrado.']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro ao deletar produto: ' . $e->getMessage()]);
        }
        break;
    
    // Para simplificar, omitimos 'PUT' (Update) por enquanto, mas o princípio é o mesmo de POST.
    case 'PUT':
        http_response_code(501); // Não implementado
        echo json_encode(['success' => false, 'message' => 'Método PUT (Atualizar) não implementado.']);
        break;

    case 'OPTIONS':
        // Necessário para requisições CORS
        http_response_code(200);
        break;

    default:
        http_response_code(405); // Método não permitido
        echo json_encode(['success' => false, 'message' => 'Método não permitido.']);
        break;
}