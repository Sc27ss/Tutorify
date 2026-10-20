import { describe, it as test } from "node:test";
import assert from "node:assert/strict";
const expect = (actual: unknown) => ({ toBe: (expected: unknown) => assert.equal(actual, expected) });
import { puedeAccederSolicitud, protegeAccesoPropio, rolValido } from "./permisos.ts";

describe("Tutorify permissions", () => {
  test("only supported roles can access app data", () => {
    expect(rolValido("admin")).toBe(true);
    expect(rolValido("tutor")).toBe(true);
    expect(rolValido("estudiante")).toBe(true);
    expect(rolValido("owner")).toBe(false);
  });
  test("students cannot manage another student's work or create assignments", () => {
    const student = { id: "student-1", rol: "estudiante", tutor_id: null };
    expect(puedeAccederSolicitud(student, { estudiante_id: "student-2", tutor_id: 1 }, false)).toBe(false);
    expect(puedeAccederSolicitud(student, { estudiante_id: "student-1", tutor_id: 1 }, false)).toBe(true);
    expect(puedeAccederSolicitud(student, { estudiante_id: "student-1", tutor_id: 1 }, true)).toBe(false);
  });
  test("professors can only manage assigned students", () => {
    const tutor = { id: "teacher", rol: "tutor", tutor_id: 1 };
    expect(puedeAccederSolicitud(tutor, { estudiante_id: "student", tutor_id: 1 }, true)).toBe(true);
    expect(puedeAccederSolicitud(tutor, { estudiante_id: "student", tutor_id: 2 }, true)).toBe(false);
    expect(puedeAccederSolicitud({ ...tutor, tutor_id: null }, { estudiante_id: "student", tutor_id: null }, true)).toBe(false);
  });
  test("administrators cannot remove their own access", () => {
    expect(protegeAccesoPropio("admin", "admin", "estudiante")).toBe(true);
    expect(protegeAccesoPropio("admin", "admin", undefined, false)).toBe(true);
    expect(protegeAccesoPropio("admin", "other", "estudiante", false)).toBe(false);
    expect(protegeAccesoPropio("admin", "admin", "admin", true)).toBe(false);
  });
});