
import { Prisma } from "@prisma/client";
import prisma from "@database";

export const createPlanta = async (data: Prisma.PlantaCreateInput) => {
    return await prisma.planta.create({
        data: data,
    });
};


export const findAllPlantas = async (
    filtros?: {
        luminosidade?: "SOMBRA" | "MEIA_SOMBRA" | "SOL_PLENO";
        petFriendly?: boolean;
    }
) => {
    return await prisma.planta.findMany({
        where: {
            ...(filtros?.luminosidade && {
                luminosidade: filtros.luminosidade,
            }),
            ...(filtros?.petFriendly !== undefined && {
                petFriendly: filtros.petFriendly,
            }),
        },
    });
};

export const findPlantaById = async (id: number) => {
    return await prisma.planta.findUnique({
        where: { id: id },
    });
};
export const updatePlanta = async (id: number, data: Prisma.PlantaUpdateInput) => {
    return await prisma.planta.update({
        where: { id: id },
        data: data,
    });
};

export const deletePlanta = async (id: number) => {
    return await prisma.planta.delete({
        where: { id: id },
    });
};

export const sellPlanta = async (id: number, quantidade: number) => {
    return await prisma.$transaction(async (tx) => {
        const planta = await tx.planta.findUnique({
            where: { id },
        });

        if (!planta) {
            return { error: "NOT_FOUND" as const };
        }

        if (quantidade <= 0 || !Number.isInteger(quantidade)) {
            return { error: "INVALID_QUANTITY" as const };
        }

        if (planta.estoque < quantidade) {
            return { error: "INSUFFICIENT_STOCK" as const };
        }

        const updatedPlanta = await tx.planta.update({
            where: { id },
            data: {
                estoque: {
                    decrement: quantidade,
                },
            },
        });

        return { planta: updatedPlanta };
    });
};

export const getValorTotalEstoque = async () => {
    const plantas = await prisma.planta.findMany();

    const valorTotalEmCentavos = plantas.reduce(
        (total, planta) => total + planta.preco * planta.estoque,
        0
    );

    const totalDeVasos = plantas.reduce(
        (total, planta) => total + planta.estoque,
        0
    );

    return {
        valorTotalEmCentavos,
        totalDeVasos,
    };
};
