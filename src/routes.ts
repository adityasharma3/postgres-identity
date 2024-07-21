import { Contact, LinkedPrecedence } from "@prisma/client";
import prisma from "./prisma";
import { NextFunction, Router } from "express";
import { Request, Response } from "express";
import { z } from 'zod';

const router = Router();

const payloadSchema = z.object({
    email: z.string().email().optional(),
    phoneNumber: z.string().optional(),
}).refine(data => data.email || data.phoneNumber, {
    message: "Either email or phoneNumber must be provided",
});

type ValidatedPayload = z.infer<typeof payloadSchema>;

router.post('/create', async (req: Request, res:Response, next: NextFunction) => {
    try {
        const payload: ValidatedPayload = payloadSchema.parse(req.body);
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

router.get('/identity', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, phoneNumber }: ValidatedPayload = payloadSchema.parse(req.query);
        const contactsFound = await prisma.contact.findMany({
            where: { OR: [{ email }, { phoneNumber }] }
        });

        if (contactsFound.length === 0) {
            throw Error("No contacts found for the given email or phone number");
        }
        
        const primaryContact = contactsFound.find((item) => item.linkedPrecedence === LinkedPrecedence.Primary);
        if (!primaryContact) {
            throw Error(`Contact ${email} & ${phoneNumber} has no primary contacts, all records consist of secondary contacts`);
        }
 
        const emails = new Set<string>(), phoneNumbers = new Set<string>(), secondaryContactIds: number[] = [];
        const secondaryContacts = contactsFound.filter((item) => item.linkedPrecedence === LinkedPrecedence.Secondary);
        if (secondaryContacts.length > 0) {
            secondaryContacts.forEach((item) => {
                emails.add(item.email);
                phoneNumbers.add(item.phoneNumber);
                secondaryContactIds.push(item.id);
            });
        }

        res.json({
            contact: {
                primaryContactId: primaryContact.id,
                emails: Array.from(emails),
                phoneNumbers: Array.from(phoneNumbers),
                secondaryContactIds
            }
        })
    } catch (error) {
        next(error);
    }
});

router.get('/fetch-all', async (_req: Request, res: Response) => {
    const response = await prisma.contact.findMany({});
    res.json(response);
});

export default router;
