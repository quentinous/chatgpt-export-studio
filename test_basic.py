#!/usr/bin/env python3
"""
Basic tests for ChatGPT Export Studio (bandofy_export_studio package)
Run with: python3 test_basic.py
"""

import os
import sys
import tempfile
import shutil
import json
import zipfile

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from bandofy_export_studio.core import (
    Database,
    Chunker,
    redact_pii,
    import_export_zip,
    load_conversations_from_export_zip,
    export_conversation_markdown,
    export_messages_jsonl,
    export_training_pairs_jsonl,
    export_obsidian_vault,
    parse_conversations_json,
)

def test_pii_redaction():
    """Test PII redaction"""
    print("Testing PII redaction...")

    text = "Contact me at john@example.com or 555-123-4567"
    redacted = redact_pii(text)

    assert "john@example.com" not in redacted, "Email should be redacted"
    assert "555-123-4567" not in redacted, "Phone should be redacted"
    assert "[REDACTED_" in redacted, "Should contain redaction tokens"

    print("✓ PII redaction tests passed")

def test_parse_conversations():
    """Test conversation JSON parsing"""
    print("Testing conversation parsing...")

    sample = [
        {
            "id": "conv-001",
            "title": "Test",
            "create_time": 1704067200,
            "update_time": 1704067200,
            "mapping": {
                "node-1": {
                    "message": {
                        "id": "msg-001",
                        "author": {"role": "user"},
                        "create_time": 1704067200,
                        "content": {"parts": ["Hello world"]},
                    }
                },
                "node-2": {
                    "message": {
                        "id": "msg-002",
                        "author": {"role": "assistant"},
                        "create_time": 1704067300,
                        "content": {"parts": ["Hi there!"]},
                    }
                },
            },
        }
    ]

    convs, msgs = parse_conversations_json(sample)
    assert len(convs) == 1, "Should parse 1 conversation"
    assert convs[0].title == "Test"
    assert len(msgs) == 2, "Should parse 2 messages"
    roles = {m.role for m in msgs}
    assert "user" in roles and "assistant" in roles

    print("✓ Conversation parsing tests passed")

def test_import_and_search():
    """Test import and search functionality"""
    print("Testing import and search...")

    workspace = tempfile.mkdtemp()
    db_path = os.path.join(workspace, "test.db")

    try:
        # Create sample data
        sample_data = [
            {
                "id": "conv-test-001",
                "title": "Test Conversation",
                "create_time": 1704067200,
                "update_time": 1704067200,
                "mapping": {
                    "msg-test-001": {
                        "id": "msg-test-001",
                        "parent": None,
                        "message": {
                            "id": "msg-test-001",
                            "author": {"role": "user"},
                            "create_time": 1704067200,
                            "content": {
                                "parts": ["Tell me about machine learning"]
                            },
                        },
                    },
                    "msg-test-002": {
                        "id": "msg-test-002",
                        "parent": "msg-test-001",
                        "message": {
                            "id": "msg-test-002",
                            "author": {"role": "assistant"},
                            "create_time": 1704067300,
                            "content": {
                                "parts": [
                                    "Machine learning is a subset of AI that enables systems to learn from data."
                                ]
                            },
                        },
                    },
                },
            }
        ]

        # Create ZIP
        json_path = os.path.join(workspace, "conversations.json")
        with open(json_path, "w") as f:
            json.dump(sample_data, f)

        zip_path = os.path.join(workspace, "test_export.zip")
        with zipfile.ZipFile(zip_path, "w") as zf:
            zf.write(json_path, "conversations.json")

        # Test import
        db = Database(db_path)
        stats = import_export_zip(db, zip_path)

        assert stats["conversations"] == 1, "Should import 1 conversation"
        assert stats["messages"] == 2, "Should import 2 messages"

        # Test search
        results = db.search_messages("machine", limit=10)
        assert len(results) > 0, "Should find search results"

        # Test chunking
        chunker = Chunker(db)
        chunk_stats = chunker.chunk_all()
        assert chunk_stats["chunks"] > 0, "Should create chunks"

        db.close()

        print("✓ Import and search tests passed")

    finally:
        shutil.rmtree(workspace)

def test_exports():
    """Test export functionality"""
    print("Testing exports...")

    workspace = tempfile.mkdtemp()
    db_path = os.path.join(workspace, "test.db")

    try:
        db = Database(db_path)

        # Insert test conversation (matches package schema)
        db.conn.execute(
            """
            INSERT INTO conversations (id, title, created_at, updated_at, message_count, source_hash)
            VALUES ('conv-1', 'Test', 1704067200, 1704067200, 2, 'hash1')
            """
        )

        # Insert test messages (matches package schema)
        db.conn.execute(
            """
            INSERT INTO messages (id, conversation_id, role, created_at, turn_index, content_text)
            VALUES ('msg-1', 'conv-1', 'user', 1704067200, 0, 'Question?')
            """
        )

        db.conn.execute(
            """
            INSERT INTO messages (id, conversation_id, role, created_at, turn_index, content_text)
            VALUES ('msg-2', 'conv-1', 'assistant', 1704067300, 1, 'Answer.')
            """
        )

        db.conn.commit()

        # Test markdown export
        md = export_conversation_markdown(db, "conv-1")
        assert "# Test" in md, "Should contain title"
        assert "Question?" in md, "Should contain user message"
        assert "Answer." in md, "Should contain assistant message"

        # Test messages JSONL export
        jsonl_path = os.path.join(workspace, "messages.jsonl")
        n = export_messages_jsonl(db, jsonl_path)
        assert n == 2, "Should export 2 messages"
        assert os.path.exists(jsonl_path), "Should create messages.jsonl"

        # Test training pairs export
        pairs_path = os.path.join(workspace, "pairs.jsonl")
        n = export_training_pairs_jsonl(db, pairs_path)
        assert n == 1, "Should export 1 pair"
        assert os.path.exists(pairs_path), "Should create pairs.jsonl"

        # Test obsidian export
        vault_dir = os.path.join(workspace, "vault")
        stats = export_obsidian_vault(db, vault_dir)
        assert stats["files_written"] == 1, "Should write 1 file"
        assert os.path.exists(os.path.join(vault_dir, "INDEX.md")), "Should create INDEX.md"

        db.close()

        print("✓ Export tests passed")

    finally:
        shutil.rmtree(workspace)

def test_exports_with_redaction():
    """Test that redact=True actually strips PII from all export formats"""
    print("Testing exports with PII redaction...")

    workspace = tempfile.mkdtemp()
    db_path = os.path.join(workspace, "test.db")

    try:
        db = Database(db_path)

        db.conn.execute(
            """
            INSERT INTO conversations (id, title, created_at, updated_at, message_count, source_hash)
            VALUES ('conv-pii', 'PII Test', 1704067200, 1704067200, 2, 'hash-pii')
            """
        )
        db.conn.execute(
            """
            INSERT INTO messages (id, conversation_id, role, created_at, turn_index, content_text)
            VALUES ('msg-pii-1', 'conv-pii', 'user', 1704067200, 0, 'My email is leak@secret.com and phone 555-987-6543')
            """
        )
        db.conn.execute(
            """
            INSERT INTO messages (id, conversation_id, role, created_at, turn_index, content_text)
            VALUES ('msg-pii-2', 'conv-pii', 'assistant', 1704067300, 1, 'Got it, leak@secret.com noted.')
            """
        )
        db.conn.commit()

        # Markdown export with redaction
        md = export_conversation_markdown(db, "conv-pii", redact=True)
        assert "leak@secret.com" not in md, "Markdown export should redact email"
        assert "555-987-6543" not in md, "Markdown export should redact phone"
        assert "[REDACTED_EMAIL]" in md, "Markdown export should contain redaction token"

        # Messages JSONL with redaction
        jsonl_path = os.path.join(workspace, "redacted.jsonl")
        export_messages_jsonl(db, jsonl_path, redact=True)
        content = open(jsonl_path, "r", encoding="utf-8").read()
        assert "leak@secret.com" not in content, "JSONL export should redact email"
        assert "[REDACTED_EMAIL]" in content, "JSONL export should contain redaction token"

        # Training pairs with redaction
        pairs_path = os.path.join(workspace, "redacted_pairs.jsonl")
        export_training_pairs_jsonl(db, pairs_path, redact=True)
        content = open(pairs_path, "r", encoding="utf-8").read()
        assert "leak@secret.com" not in content, "Pairs export should redact email in both prompt and completion"

        db.close()

        print("✓ Export redaction tests passed")

    finally:
        shutil.rmtree(workspace)


def test_parse_messages_list_format():
    """Test parsing conversations that use a 'messages' list instead of 'mapping' dict"""
    print("Testing messages list format parsing...")

    sample = [
        {
            "id": "conv-list-001",
            "title": "List Format Conv",
            "create_time": 1704067200,
            "update_time": 1704067200,
            "messages": [
                {
                    "id": "m1",
                    "role": "user",
                    "create_time": 1704067200,
                    "content": {"parts": ["Hello from list format"]},
                },
                {
                    "id": "m2",
                    "role": "assistant",
                    "create_time": 1704067300,
                    "content": {"parts": ["Response from list format"]},
                },
            ],
        }
    ]

    convs, msgs = parse_conversations_json(sample)
    assert len(convs) == 1, "Should parse 1 conversation from list format"
    assert convs[0].title == "List Format Conv"
    assert len(msgs) == 2, "Should parse 2 messages from list format"
    assert msgs[0].content_text == "Hello from list format"
    assert msgs[1].content_text == "Response from list format"

    print("✓ Messages list format parsing tests passed")


def test_reimport_idempotency():
    """Test that importing the same ZIP twice does not duplicate data"""
    print("Testing re-import idempotency...")

    workspace = tempfile.mkdtemp()
    db_path = os.path.join(workspace, "test.db")

    try:
        sample_data = [
            {
                "id": "conv-idem-001",
                "title": "Idempotent Conv",
                "create_time": 1704067200,
                "update_time": 1704067200,
                "mapping": {
                    "node-1": {
                        "message": {
                            "id": "msg-idem-001",
                            "author": {"role": "user"},
                            "create_time": 1704067200,
                            "content": {"parts": ["First message"]},
                        }
                    },
                },
            }
        ]

        json_path = os.path.join(workspace, "conversations.json")
        with open(json_path, "w") as f:
            json.dump(sample_data, f)

        zip_path = os.path.join(workspace, "test_export.zip")
        with zipfile.ZipFile(zip_path, "w") as zf:
            zf.write(json_path, "conversations.json")

        db = Database(db_path)

        # Import once
        import_export_zip(db, zip_path)
        stats1 = db.stats()

        # Import again
        import_export_zip(db, zip_path)
        stats2 = db.stats()

        assert stats1["conversations"] == stats2["conversations"], \
            f"Re-import should not duplicate conversations: {stats1['conversations']} vs {stats2['conversations']}"
        assert stats1["messages"] == stats2["messages"], \
            f"Re-import should not duplicate messages: {stats1['messages']} vs {stats2['messages']}"

        db.close()

        print("✓ Re-import idempotency tests passed")

    finally:
        shutil.rmtree(workspace)


def test_defensive_parsing():
    """Test that malformed input doesn't crash the parser"""
    print("Testing defensive parsing...")

    # Non-dict entries in the list should be skipped
    convs, msgs = parse_conversations_json(["not a dict", 42, None])
    assert len(convs) == 0, "Should skip non-dict entries"
    assert len(msgs) == 0, "Should produce no messages from non-dict entries"

    # Conversation with no ID should get a generated one
    convs, msgs = parse_conversations_json([
        {
            "title": "No ID",
            "create_time": 1704067200,
            "mapping": {
                "n1": {
                    "message": {
                        "id": "m1",
                        "author": {"role": "user"},
                        "content": {"parts": ["Hello"]},
                    }
                },
            },
        }
    ])
    assert len(convs) == 1, "Should parse conversation with generated ID"
    assert convs[0].conversation_id != "", "Generated ID should not be empty"

    # Conversation with no title
    convs, msgs = parse_conversations_json([
        {"id": "conv-notitle", "create_time": 1704067200, "mapping": {}}
    ])
    assert convs[0].title == "Untitled", "Missing title should default to 'Untitled'"

    # Empty mapping (no messages)
    convs, msgs = parse_conversations_json([
        {"id": "conv-empty", "title": "Empty", "create_time": 1704067200, "mapping": {}}
    ])
    assert len(convs) == 1, "Should still parse conversation with empty mapping"
    assert convs[0].message_count == 0, "Empty mapping should yield 0 messages"

    # Mapping nodes with missing/null message
    convs, msgs = parse_conversations_json([
        {
            "id": "conv-nullmsg",
            "title": "Null Msg",
            "create_time": 1704067200,
            "mapping": {
                "n1": {"message": None},
                "n2": "not a dict",
                "n3": {"message": {"id": "ok", "author": {"role": "user"}, "content": {"parts": ["Valid"]}}},
            },
        }
    ])
    assert len(msgs) == 1, "Should skip null/invalid nodes and keep valid ones"
    assert msgs[0].content_text == "Valid"

    # Non-list root should raise
    raised = False
    try:
        parse_conversations_json({"not": "a list"})
    except ValueError:
        raised = True
    assert raised, "Non-list root should raise ValueError"

    print("✓ Defensive parsing tests passed")


def test_invalid_zip():
    """Test that a ZIP without conversations.json raises ValueError"""
    print("Testing invalid ZIP handling...")

    workspace = tempfile.mkdtemp()

    try:
        # ZIP with no conversations.json
        zip_path = os.path.join(workspace, "bad.zip")
        with zipfile.ZipFile(zip_path, "w") as zf:
            zf.writestr("readme.txt", "no conversations here")

        raised = False
        try:
            load_conversations_from_export_zip(zip_path)
        except ValueError as e:
            raised = True
            assert "conversations.json" in str(e).lower()
        assert raised, "Should raise ValueError for ZIP without conversations.json"

        # Non-existent file
        raised = False
        try:
            load_conversations_from_export_zip("/nonexistent/path.zip")
        except FileNotFoundError:
            raised = True
        assert raised, "Should raise FileNotFoundError for missing file"

        print("✓ Invalid ZIP handling tests passed")

    finally:
        shutil.rmtree(workspace)


def test_training_pairs_non_alternating():
    """Test pair extraction with non-alternating roles (consecutive users, tool messages, etc.)"""
    print("Testing training pairs with non-alternating roles...")

    workspace = tempfile.mkdtemp()
    db_path = os.path.join(workspace, "test.db")

    try:
        db = Database(db_path)

        db.conn.execute(
            """
            INSERT INTO conversations (id, title, created_at, updated_at, message_count, source_hash)
            VALUES ('conv-roles', 'Roles Test', 1704067200, 1704067200, 5, 'hash-roles')
            """
        )

        # user -> user -> assistant -> tool -> user -> assistant
        messages = [
            ("r1", "conv-roles", "user",      1704067200, 0, "First user msg"),
            ("r2", "conv-roles", "user",      1704067201, 1, "Second user msg"),
            ("r3", "conv-roles", "assistant", 1704067202, 2, "Reply to second"),
            ("r4", "conv-roles", "tool",      1704067203, 3, "Tool output"),
            ("r5", "conv-roles", "user",      1704067204, 4, "Third user msg"),
            ("r6", "conv-roles", "assistant", 1704067205, 5, "Reply to third"),
        ]
        for mid, cid, role, ts, idx, text in messages:
            db.conn.execute(
                "INSERT INTO messages (id, conversation_id, role, created_at, turn_index, content_text) VALUES (?,?,?,?,?,?)",
                (mid, cid, role, ts, idx, text),
            )
        db.conn.commit()

        pairs_path = os.path.join(workspace, "pairs.jsonl")
        n = export_training_pairs_jsonl(db, pairs_path)

        # Expected pairs: (user@1 -> assistant@2) and (user@4 -> assistant@5)
        # NOT (user@0 -> user@1) and NOT (tool@3 -> user@4)
        assert n == 2, f"Should extract exactly 2 valid pairs, got {n}"

        with open(pairs_path, "r", encoding="utf-8") as f:
            lines = [json.loads(line) for line in f]

        assert lines[0]["prompt"] == "Second user msg", "First pair prompt should be second user msg"
        assert lines[0]["completion"] == "Reply to second"
        assert lines[1]["prompt"] == "Third user msg", "Second pair prompt should be third user msg"
        assert lines[1]["completion"] == "Reply to third"

        db.close()

        print("✓ Training pairs non-alternating roles tests passed")

    finally:
        shutil.rmtree(workspace)


def main():
    """Run all tests"""
    print("=" * 60)
    print("ChatGPT Export Studio - Basic Tests")
    print("=" * 60)
    print()

    try:
        test_pii_redaction()
        test_parse_conversations()
        test_parse_messages_list_format()
        test_defensive_parsing()
        test_invalid_zip()
        test_import_and_search()
        test_reimport_idempotency()
        test_exports()
        test_exports_with_redaction()
        test_training_pairs_non_alternating()

        print()
        print("=" * 60)
        print("✓ All tests passed!")
        print("=" * 60)
        return 0

    except AssertionError as e:
        print()
        print("=" * 60)
        print(f"✗ Test failed: {e}")
        print("=" * 60)
        return 1
    except Exception as e:
        print()
        print("=" * 60)
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        print("=" * 60)
        return 1

if __name__ == "__main__":
    sys.exit(main())
