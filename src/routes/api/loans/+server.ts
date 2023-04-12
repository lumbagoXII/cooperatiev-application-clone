import { AddLoanSchemaValidation } from "$lib/definitions/schema";
import type { Loan as LoanType } from "$lib/definitions/types";
import { getSessionMetadata } from "$lib/internal/session";
import { LoanStatuses } from "$lib/internal/transaction";
import { Loan } from "$lib/models/model";
import { json, type RequestHandler } from "@sveltejs/kit";
import { StatusCodes } from "http-status-codes";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const parsedBody = await AddLoanSchemaValidation.validate(body);

    const interest = (parsedBody.interest / 100) * parsedBody.amount;
    const totalDue = parsedBody.amount + interest;

    await Loan.create({
      memberId: parsedBody.memberId,
      principal: parsedBody.amount,
      tenure: parsedBody.tenure,
      status: LoanStatuses.Requested,
      interest,
      remainingBalance: totalDue,
      totalDue,
    });

    return json({ message: "Loan has been added." });
  } catch (error) {
    console.log(error);
    return json(
      { message: "Unknown error occured." },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
};

export const GET: RequestHandler = async (event) => {
  try {
    const session = await getSessionMetadata(event);
    const loanModel = await Loan.findAll({});
    return json({
      message: "Loans has been fetched.",
      data: {
        loans: loanModel.map((l) => l.get({ plain: true })) ?? [],
      },
    });
  } catch (error) {
    return json({}, { status: StatusCodes.INTERNAL_SERVER_ERROR });
  }
};
