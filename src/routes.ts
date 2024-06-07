import { Contact, LinkedPrecedence } from "@prisma/client";
import prisma from "./prisma";
import { NextFunction, Router } from "express";
import { Request, Response } from "express";

const router = Router();

router.post('/create', async (req: Request, res:Response, next: NextFunction) => {
    try {
        const payload: Record<string, any> = req.body;
        if (!payload.email && !payload.phoneNumber) {
            throw Error("Both email & phone number cannot be null");
        }

        let newContactPayload: Partial<Contact>;
        const matchingContacts = await prisma.contact.findMany({
            where: { OR: [
                { email: payload.email }, { phoneNumber: payload.phoneNumber }
            ]},
        });

        if (matchingContacts?.length === 0) {
            newContactPayload = {
                email: payload?.email,
                phoneNumber: payload?.phoneNumber,
                linkedId: null,
                linkedPrecedence: LinkedPrecedence.Primary,
            }
        } else {
            const primaryContact = matchingContacts.find((item) => item.linkedPrecedence === LinkedPrecedence.Primary);
            newContactPayload = {
                linkedId: primaryContact?.id ?? matchingContacts[0].linkedId,
                email: payload.email,
                phoneNumber: payload.phoneNumber,
                linkedPrecedence: LinkedPrecedence.Secondary    
            }
        }

        await prisma.contact.create({ data: newContactPayload });
        res.json({ status: 'success' });
    } catch (error) {
        next(error);
    }

});

router.get('/identify', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const email = req.query.email as string;
        const phoneNumber = req.query.phoneNumber as string;
        if (!email && !phoneNumber) {
            throw Error("Both email & phone number cannot be null");
        }
        const contactsFound = await prisma.contact.findMany({
            where:
            { OR: [{ email }, { phoneNumber }] }
        });

        if (contactsFound.length === 0) {
            throw Error("No contacts found for the given email or phone number");
        }
        
        const primaryContact = contactsFound.find((item) => item.linkedPrecedence === LinkedPrecedence.Primary);
        const emails = [primaryContact.email], phoneNumbers = [primaryContact.phoneNumber], secondaryContactIds: number[] = [];
        const secondaryContacts = contactsFound.filter((item) => item.linkedPrecedence === LinkedPrecedence.Secondary);
        if (secondaryContacts.length > 0) {
            secondaryContacts.forEach((item) => {
                emails.push(item.email);
                phoneNumbers.push(item.phoneNumber);
                secondaryContactIds.push(item.id);
            });
        }

        res.json({
            contact: {
                primaryContactId: primaryContact.id,
                emails,
                phoneNumbers,
                secondaryContactIds
            }
        })
    } catch(error) {
        next(error);
    }
});

router.get('/fetch-all', async (req: Request, res: Response) => {
    const response = await prisma.contact.findMany({});
    res.json(response);
});

export default router;
