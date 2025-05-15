import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandler = async (event) => {
  const tableName = "CinemaTable";

  const cinemaId = Number(event.pathParameters?.cinemaId);
  const period = event.queryStringParameters?.period;

  if (!cinemaId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "cinemaId is required" }),
    };
  }

  try {
    if (period) {
      // Query using Local Secondary Index (periodIx)
      const result = await ddbDocClient.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: "periodIx",
          KeyConditionExpression: "cinemaId = :cinemaId AND period = :period",
          ExpressionAttributeValues: {
            ":cinemaId": cinemaId,
            ":period": period,
          },
        })
      );

      return {
        statusCode: 200,
        body: JSON.stringify(result.Items || []),
      };
    } else {
      // Query all movies for the cinemaId
      const result = await ddbDocClient.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: "cinemaId = :cinemaId",
          ExpressionAttributeValues: {
            ":cinemaId": cinemaId,
          },
        })
      );

      return {
        statusCode: 200,
        body: JSON.stringify(result.Items || []),
      };
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch data" }),
    };
  }
};
