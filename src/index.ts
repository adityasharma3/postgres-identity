import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient();

async function main() {
    // const response = await prisma.user.create({
    //     data: {
    //         email: 'testing' + Math.round(Math.random() * 100) + '@yopmail.com',
    //         name: 'adityatesting'
    //     }
    // })

    // console.log(response);
    const response = await prisma.user.findMany({});
    console.log(response);
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect()
        process.exit(1)
    });