import { Request, Response, NextFunction } from 'express';
import { app  } from  "./server";
import prisma from "./prisma";
import router from "./routes";

async function init() {
    await prisma.$connect();
    app.listen(3071, () => console.log(`listening on port 3071`));
    app.use('/api', router);
    app.use(errorHandler);
}

const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err); 
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
        },
    });
};

init();