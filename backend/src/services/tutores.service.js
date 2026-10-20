/** Lógica de negocio: RF-02 búsqueda de tutores y materias. */
const usuarios = require("../repositories/usuarios.repository");
const materias = require("../repositories/materias.repository");

const listarMaterias = () => materias.listar();
const buscarTutores = (filtros) => usuarios.buscarTutores(filtros);

module.exports = { listarMaterias, buscarTutores };
