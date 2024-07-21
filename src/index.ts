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

app.get('/', (_req: Request, res: Response) => {
    const HTMLResponse = `
    <div>
        <h2>Hi, I'm Aditya. thanks for reviewing my assignment.</h2>
            <p>Please hit the endpoint /api/identify?phoneNumber=123456 to view the assignment</p>
            <p>Also, to view contacts stored in db please navigate to endpoint /api/fetch-all</p>
            <p>To create new contacts please send a POST request to /create endpoint and pass 'email' & 'phoneNumber' as params</p>
            <a href="https://www.linkedin.com/in/adityyasharma/">My Linkedin</a>
    </div>
    `;
    res.send(HTMLResponse);
});

init();