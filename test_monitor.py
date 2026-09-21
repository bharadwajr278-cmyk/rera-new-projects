import json
import tempfile
import unittest
from pathlib import Path

from monitor import (
    GURUGRAM_PORTAL_URL,
    Project,
    extract_registered_projects,
    extract_up_rera_projects,
    infer_project_type,
    mark_notified,
    open_database,
    pending_projects,
)


class MonitorTests(unittest.TestCase):
    def test_gurugram_uses_separate_official_registration_list(self):
        self.assertEqual(
            GURUGRAM_PORTAL_URL,
            "https://haryanarera.gov.in/admincontrol/registered_projects/2",
        )

    def test_extracts_portal_row(self):
        page = """
        <table id="compliant_hearing"><tbody><tr>
          <td>1</td><td>HRERA-PKL-FBD-914-2026</td>
          <td><a href="/view_project/searchprojectDetail/3599">RERA-PKL-2033-2026</a></td>
          <td>AMOLIK CONCORDIA LIVING- I</td><td>LOGERS REAL ESTATE BUILDERS LLP</td>
          <td>SECTOR-97, FARIDABAD</td><td>FARIDABAD</td><td>HRERA</td>
          <td><a href="/view_project/project_preview_open/3599">View</a></td>
          <td>17/03/2031</td>
        </tr>""" + "".join(
            f"<tr><td>{i}</td><td>REG-{i}</td><td>ID-{i}</td><td>N</td><td>B</td><td>L</td><td>C</td><td>R</td><td></td><td>D</td></tr>"
            for i in range(2, 502)
        ) + "</tbody></table>"
        projects = extract_registered_projects(page)
        self.assertEqual(projects[0].city, "FARIDABAD")
        self.assertTrue(projects[0].priority)
        self.assertTrue(projects[0].detail_url.endswith("/3599"))

    def test_type_inference_uses_strong_phrase(self):
        p = Project("R1", "P1", "Affordable Plotted Colony", "B", "Sector 1", "GURUGRAM", "HRERA", "", "", "")
        self.assertEqual(infer_project_type(p, None), "Residential – Plotted Development")

    def test_extracts_up_rera_feed_with_quoted_title(self):
        record = (
            '[{"application_id":"169926","registration_id":"UPRERAPRJ574384/09/2026",'
            '"promoter_name":"Gaursons Realtech Private Limited",'
            '"project_name":""1st Park View" - Gaur Yamuna City",'
            '"applicant_type":"New","district":"Gautam Buddha Nagar",'
            '"Project_catagory":"Residential","Project_type":""}]'
        )
        projects = extract_up_rera_projects(record * 501)
        self.assertEqual(projects[0].registration_number, "UPRERAPRJ574384/09/2026")
        self.assertEqual(projects[0].city, "NOIDA / GREATER NOIDA")
        self.assertEqual(projects[0].project_type, "Residential (New)")
        self.assertTrue(projects[0].priority)
        self.assertTrue(projects[0].key.startswith("UP RERA::"))

    def test_pending_json_and_mark_notified(self):
        with tempfile.TemporaryDirectory() as folder:
            db = open_database(Path(folder) / "state.sqlite3")
            project = Project("R1", "P1", "Queued Project", "Builder", "Sector 1", "GURUGRAM", "HRERA", "", "", "")
            db.execute(
                "INSERT INTO registrations(registration_key, first_seen_at, payload) VALUES (?, ?, ?)",
                (project.key, "2026-09-21T00:00:00+00:00", json.dumps(project.__dict__)),
            )
            db.commit()
            queued = pending_projects(db)
            self.assertEqual(queued[0]["registration_key"], project.key)
            self.assertTrue(mark_notified(db, project.key))
            self.assertEqual(pending_projects(db), [])
            self.assertFalse(mark_notified(db, project.key))
            db.close()


if __name__ == "__main__":
    unittest.main()
