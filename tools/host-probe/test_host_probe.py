"""Deterministic offline tests + real loopback API integration smoke test."""
import http.client
from http.server import ThreadingHTTPServer
from pathlib import Path
import tempfile
import threading
import unittest

from frame9_host_probe import collect_snapshot, make_handler, parse_cpu_model, parse_meminfo, parse_os_release

TOKEN = "test-token-with-at-least-thirty-two-characters"


class ParserTests(unittest.TestCase):
    def test_os_release(self):
        self.assertEqual(parse_os_release('ID=ubuntu\nPRETTY_NAME="Ubuntu 24.04 LTS"\n'),
                         {"id": "ubuntu", "pretty_name": "Ubuntu 24.04 LTS", "version_id": None})

    def test_arm_processor_index_not_mistaken_for_cpu_model(self):
        self.assertIsNone(parse_cpu_model("processor : 0\nprocessor : 1\n"))

    def test_memory(self):
        self.assertEqual(parse_meminfo("MemTotal:   8192000 kB\nMemAvailable:   4096000 kB\n"),
                         {"total_mib": 8000, "available_mib": 4000})

    def test_cpu_model(self):
        self.assertEqual(parse_cpu_model("model name\t: Test CPU\n"), "Test CPU")

    def test_snapshot_omits_sensitive_identifiers(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            (base / "proc").mkdir()
            (base / "sys/devices/virtual/dmi/id").mkdir(parents=True)
            (base / "proc/meminfo").write_text("MemTotal: 1048576 kB\nMemAvailable: 524288 kB\n")
            (base / "proc/cpuinfo").write_text("model name\t: Fixture CPU\n")
            (base / "proc/uptime").write_text("1234.56 99\n")
            (base / "sys/devices/virtual/dmi/id/product_name").write_text("Laptop Model\n")
            (base / "os-release").write_text("ID=testos\nPRETTY_NAME='Test OS'\n")
            snapshot = collect_snapshot(proc=base / "proc", sysroot=base / "sys", os_release=base / "os-release")
            self.assertNotIn("hostname", snapshot)
            self.assertEqual(snapshot["hardware"]["memory"]["total_mib"], 1024)
            self.assertEqual(snapshot["hardware"]["product_model"], "Laptop Model")
            self.assertFalse(snapshot["privacy"]["serial_numbers_included"])
            self.assertEqual(snapshot["runtime"]["uptime_seconds"], 1234)

    def test_missing_kernel_interfaces_do_not_crash(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            s = collect_snapshot(proc=base / "missing", sysroot=base / "missing-sys", os_release=base / "missing-release")
            self.assertIsNone(s["hardware"]["memory"]["total_mib"])
            self.assertFalse(s["kernel_interfaces"]["procfs_accessible"])

    def test_short_secret_rejected(self):
        with self.assertRaises(ValueError):
            make_handler("short")


class HttpTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(TOKEN, lambda: {"data": "real-fixture"}))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=3)

    def fetch(self, path="/v1/snapshot", headers=None):
        conn = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=3)
        conn.request("GET", path, headers=headers or {})
        response = conn.getresponse()
        status, body, cors = response.status, response.read(), response.getheader("Access-Control-Allow-Origin")
        conn.close()
        return status, body, cors

    def test_no_auth_denied(self):
        status, data, _ = self.fetch()
        self.assertEqual(status, 401)
        self.assertIn(b"unauthorized", data)

    def test_valid_local_token(self):
        status, data, cors = self.fetch(headers={"Authorization": "Bearer " + TOKEN})
        self.assertEqual(status, 200)
        self.assertIn(b"real-fixture", data)
        self.assertIsNone(cors)

    def test_browser_origin_rejected(self):
        status, _, _ = self.fetch(headers={"Authorization": "Bearer " + TOKEN, "Origin": "https://example.com"})
        self.assertEqual(status, 403)

    def test_dns_rebinding_header_rejected(self):
        status, _, _ = self.fetch(headers={"Authorization": "Bearer " + TOKEN, "Host": "attacker.invalid"})
        self.assertEqual(status, 403)

    def test_health_requires_token(self):
        self.assertEqual(self.fetch("/v1/health")[0], 401)
        self.assertEqual(self.fetch("/v1/health", {"Authorization": "Bearer " + TOKEN})[0], 200)

    def test_no_remote_binding(self):
        self.assertEqual(self.server.server_address[0], "127.0.0.1")


if __name__ == "__main__":
    unittest.main()
