
import { Request, Response } from "express";
import * as PlantaRepository from "@repositories/PlantaRepository";

export const createPlanta = async (req: Request, res: Response) => {
  try {
    const {
      nome,
      especie,
      preco,
      estoque,
      luminosidade,
      petFriendly,
      regaACadaDias,
    } = req.body;

    if (
      !nome ||
      !especie ||
      typeof preco !== "number" ||
      typeof estoque !== "number" ||
      !luminosidade ||
      typeof petFriendly !== "boolean" ||
      typeof regaACadaDias !== "number"
    ) {
      return res.status(400).json({
        message: "Preencha todos os campos obrigatórios com valores válidos.",
      });
    }

    if (preco <= 0 || estoque < 0 || regaACadaDias < 1) {
      return res.status(400).json({
        message: "Preço deve ser maior que zero, estoque não pode ser negativo e rega deve ser de pelo menos 1 dia.",
      });
    }

    const luminosidadesValidas = ["SOMBRA", "MEIA_SOMBRA", "SOL_PLENO"];

    if (!luminosidadesValidas.includes(luminosidade)) {
      return res.status(400).json({
        message: "Luminosidade inválida.",
      });
    }

    const planta = await PlantaRepository.createPlanta({
      nome,
      especie,
      preco,
      estoque,
      luminosidade,
      petFriendly,
      regaACadaDias,
    });

    return res.status(201).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao cadastrar planta." });
  }
};


export const readAllPlantas = async (req: Request, res: Response) => {
  try {
    const luminosidade = req.query.luminosidade as string | undefined;
    const petFriendlyQuery = req.query.petFriendly as string | undefined;

    if (
      luminosidade &&
      !["SOMBRA", "MEIA_SOMBRA", "SOL_PLENO"].includes(luminosidade)
    ) {
      return res.status(400).json({ message: "Luminosidade inválida." });
    }

    if (
      petFriendlyQuery !== undefined &&
      petFriendlyQuery !== "true" &&
      petFriendlyQuery !== "false"
    ) {
      return res.status(400).json({ message: "petFriendly deve ser true ou false." });
    }

    const plantas = await PlantaRepository.findAllPlantas({
      luminosidade: luminosidade as "SOMBRA" | "MEIA_SOMBRA" | "SOL_PLENO" | undefined,
      petFriendly:
        petFriendlyQuery === undefined
          ? undefined
          : petFriendlyQuery === "true",
    });

    return res.status(200).json(plantas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar plantas." });
  }
};

export const readPlantaById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "ID inválido." });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    return res.status(200).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar planta." });
  }
};

export const updatePlanta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "ID inválido." });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    const {
      nome,
      especie,
      preco,
      estoque,
      luminosidade,
      petFriendly,
      regaACadaDias,
    } = req.body;

    if (
      (nome !== undefined && (typeof nome !== "string" || !nome.trim())) ||
      (especie !== undefined && (typeof especie !== "string" || !especie.trim())) ||
      (preco !== undefined && (typeof preco !== "number" || preco <= 0)) ||
      (estoque !== undefined && (typeof estoque !== "number" || estoque < 0)) ||
      (petFriendly !== undefined && typeof petFriendly !== "boolean") ||
      (regaACadaDias !== undefined &&
        (typeof regaACadaDias !== "number" || regaACadaDias < 1)) ||
      (luminosidade !== undefined &&
        !["SOMBRA", "MEIA_SOMBRA", "SOL_PLENO"].includes(luminosidade))
    ) {
      return res.status(400).json({
        message: "Um ou mais campos enviados são inválidos.",
      });
    }

    const updatedPlanta = await PlantaRepository.updatePlanta(id, {
      nome,
      especie,
      preco,
      estoque,
      luminosidade,
      petFriendly,
      regaACadaDias,
    });

    return res.status(200).json(updatedPlanta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao atualizar planta." });
  }
};

export const deletePlanta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "ID inválido." });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    await PlantaRepository.deletePlanta(id);

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao deletar planta." });
  }
};

export const sellPlanta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { quantidade } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "ID inválido." });
    }

    if (typeof quantidade !== "number" || !Number.isInteger(quantidade) || quantidade <= 0) {
      return res.status(400).json({
        message: "A quantidade deve ser um número inteiro positivo.",
      });
    }

    const resultado = await PlantaRepository.sellPlanta(id, quantidade);

    if ("error" in resultado) {
      if (resultado.error === "NOT_FOUND") {
        return res.status(404).json({ message: "Planta não encontrada." });
      }

      if (resultado.error === "INSUFFICIENT_STOCK") {
        return res.status(400).json({ message: "Estoque insuficiente." });
      }

      return res.status(400).json({ message: "Quantidade inválida." });
    }

    return res.status(200).json(resultado.planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao realizar venda." });
  }
};

export const readValorTotalEstoque = async (req: Request, res: Response) => {
  try {
    const resultado = await PlantaRepository.getValorTotalEstoque();

    return res.status(200).json(resultado);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erro ao calcular o valor total do estoque.",
    });
  }
};
