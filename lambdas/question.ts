import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import schema from "../shared/types.schema.json";
const client = createDDbDocClient();


export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const cinemaId = event.pathParameters?.cinemaId;
    const movieId = event.queryStringParameters?.movieId;

    if (!cinemaId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "cinemaId is required" }),
      };
    }

    const input: QueryCommandInput = {
      TableName: "CinemaTable",
      KeyConditionExpression: "#pk = :cinemaId",
      ExpressionAttributeNames: {
        "#pk": "cinemaId",
      },
      ExpressionAttributeValues: {
        ":cinemaId": Number(cinemaId),
      },
    };

    if (movieId) {
      input.KeyConditionExpression += " AND #sk = :movieId";
      input.ExpressionAttributeNames!["#sk"] = "movieId";
      input.ExpressionAttributeValues![":movieId"] = movieId;
    }

    const result = await client.send(new QueryCommand(input));

    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
      headers: { "content-type": "application/json" },
    };
  } catch (error: any) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
