"""
Modelos de dados para o Ambilight Player
"""

import sqlite3
import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional, Union, Tuple

class DatabaseManager:
    """Gerencia a conexão com o banco de dados SQLite."""
    
    def __init__(self, db_path: str):
        """
        Inicializa o gerenciador de banco de dados.
        
        Args:
            db_path: Caminho para o arquivo do banco de dados
        """
        self.db_path = db_path
        self._ensure_db_exists()
    
    def _ensure_db_exists(self) -> None:
        """Garante que o banco de dados e suas tabelas existam."""
        db_dir = os.path.dirname(self.db_path)
        if not os.path.exists(db_dir):
            os.makedirs(db_dir)
        
        # Se o arquivo existe mas parece estar corrompido, remova-o
        if os.path.exists(self.db_path):
            try:
                # Tenta abrir para verificar se é um banco de dados válido
                conn = sqlite3.connect(self.db_path)
                conn.execute("SELECT 1")
                conn.close()
            except sqlite3.DatabaseError:
                # Se falhar, o arquivo pode estar corrompido, então remove
                print(f"Banco de dados corrompido detectado. Removendo {self.db_path}")
                os.remove(self.db_path)
        
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        # Cria tabela de configurações se não existir
        c.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY,
            zones_per_side INTEGER DEFAULT 10,
            intensity REAL DEFAULT 1.0,
            blur_amount INTEGER DEFAULT 15,
            autoplay BOOLEAN DEFAULT 0
        )
        ''')
        
        # Cria tabela de histórico se não existir
        c.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY,
            filename TEXT,
            path TEXT,
            last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Verifica se já existem configurações padrão
        c.execute("SELECT COUNT(*) FROM settings")
        if c.fetchone()[0] == 0:
            c.execute('''
            INSERT INTO settings (zones_per_side, intensity, blur_amount, autoplay) 
            VALUES (?, ?, ?, ?)
            ''', (10, 1.0, 15, 0))
        
        conn.commit()
        conn.close()
    
    def get_connection(self) -> sqlite3.Connection:
        """
        Obtém uma conexão com o banco de dados.
        
        Returns:
            Objeto de conexão SQLite
        """
        return sqlite3.connect(self.db_path)


class Settings:
    """Modelo para as configurações do player."""
    
    def __init__(self, db_manager: DatabaseManager):
        """
        Inicializa o modelo de configurações.
        
        Args:
            db_manager: Gerenciador de banco de dados
        """
        self.db_manager = db_manager
    
    def get(self) -> Dict[str, Any]:
        """
        Obtém todas as configurações.
        
        Returns:
            Dicionário com as configurações
        """
        conn = self.db_manager.get_connection()
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        
        c.execute("SELECT * FROM settings WHERE id = 1")
        row = c.fetchone()
        
        conn.close()
        
        if row:
            return {
                'zones_per_side': row['zones_per_side'],
                'intensity': row['intensity'],
                'blur_amount': row['blur_amount'],
                'autoplay': bool(row['autoplay'])
            }
        else:
            # Retorna valores padrão se não houver configurações
            return {
                'zones_per_side': 10,
                'intensity': 1.0,
                'blur_amount': 15,
                'autoplay': False
            }
    
    def update(self, settings: Dict[str, Any]) -> bool:
        """
        Atualiza as configurações.
        
        Args:
            settings: Dicionário com as configurações a serem atualizadas
            
        Returns:
            True se a atualização foi bem-sucedida, False caso contrário
        """
        try:
            conn = self.db_manager.get_connection()
            c = conn.cursor()
            
            # Monta a query de atualização dinamicamente
            query_parts = []
            params = []
            
            for key, value in settings.items():
                if key in ['zones_per_side', 'intensity', 'blur_amount', 'autoplay']:
                    query_parts.append(f"{key} = ?")
                    
                    # Converte booleanos para 0/1
                    if key == 'autoplay':
                        params.append(1 if value else 0)
                    else:
                        params.append(value)
            
            if not query_parts:
                return False
            
            query = f"UPDATE settings SET {', '.join(query_parts)} WHERE id = 1"
            c.execute(query, params)
            
            conn.commit()
            conn.close()
            
            return True
        except Exception as e:
            print(f"Erro ao atualizar configurações: {e}")
            return False
    
    def reset(self) -> bool:
        """
        Reseta as configurações para os valores padrão.
        
        Returns:
            True se o reset foi bem-sucedido, False caso contrário
        """
        default_settings = {
            'zones_per_side': 10,
            'intensity': 1.0,
            'blur_amount': 15,
            'autoplay': False
        }
        
        return self.update(default_settings)


class History:
    """Modelo para o histórico de vídeos."""
    
    def __init__(self, db_manager: DatabaseManager):
        """
        Inicializa o modelo de histórico.
        
        Args:
            db_manager: Gerenciador de banco de dados
        """
        self.db_manager = db_manager
    
    def get_all(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Obtém todos os registros do histórico.
        
        Args:
            limit: Número máximo de registros a retornar
            
        Returns:
            Lista de dicionários com os registros do histórico
        """
        conn = self.db_manager.get_connection()
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        
        c.execute("""
        SELECT id, filename, path, last_played 
        FROM history 
        ORDER BY last_played DESC 
        LIMIT ?
        """, (limit,))
        
        result = [dict(row) for row in c.fetchall()]
        
        conn.close()
        
        # Converte as timestamps para strings formatadas
        for item in result:
            if isinstance(item['last_played'], str):
                item['last_played'] = item['last_played']
            else:
                item['last_played'] = datetime.fromtimestamp(item['last_played']).isoformat()
        
        return result
    
    def add(self, filename: str, path: str) -> bool:
        """
        Adiciona ou atualiza um registro no histórico.
        
        Args:
            filename: Nome do arquivo
            path: Caminho do arquivo
            
        Returns:
            True se a operação foi bem-sucedida, False caso contrário
        """
        try:
            conn = self.db_manager.get_connection()
            c = conn.cursor()
            
            # Verifica se o vídeo já existe no histórico
            c.execute("SELECT id FROM history WHERE path = ?", (path,))
            result = c.fetchone()
            
            if result:
                # Atualiza a data de reprodução
                c.execute("""
                UPDATE history 
                SET last_played = CURRENT_TIMESTAMP 
                WHERE id = ?
                """, (result[0],))
            else:
                # Adiciona novo registro
                c.execute("""
                INSERT INTO history (filename, path) 
                VALUES (?, ?)
                """, (filename, path))
            
            conn.commit()
            conn.close()
            
            return True
        except Exception as e:
            print(f"Erro ao adicionar ao histórico: {e}")
            return False
    
    def remove(self, history_id: int) -> bool:
        """
        Remove um registro do histórico.
        
        Args:
            history_id: ID do registro a ser removido
            
        Returns:
            True se a remoção foi bem-sucedida, False caso contrário
        """
        try:
            conn = self.db_manager.get_connection()
            c = conn.cursor()
            
            c.execute("DELETE FROM history WHERE id = ?", (history_id,))
            
            conn.commit()
            conn.close()
            
            return True
        except Exception as e:
            print(f"Erro ao remover do histórico: {e}")
            return False
    
    def clear(self) -> bool:
        """
        Limpa todo o histórico.
        
        Returns:
            True se a limpeza foi bem-sucedida, False caso contrário
        """
        try:
            conn = self.db_manager.get_connection()
            c = conn.cursor()
            
            c.execute("DELETE FROM history")
            
            conn.commit()
            conn.close()
            
            return True
        except Exception as e:
            print(f"Erro ao limpar histórico: {e}")
            return False