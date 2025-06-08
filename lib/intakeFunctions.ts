import { client } from './aws_client';
import { PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";

export async function addIntake(data: { userId: string, date: string, calories: number }) {
  const params = {
    TableName: 'IntakeTable',
    Item: {
      userId: { S: data.userId },
      date: { S: data.date },
      calories: { N: data.calories.toString() },
    },
  };
  const command = new PutItemCommand(params);
  return client.send(command);
}

export async function getIntakeByDate(userId: string, date: string) {
  const params = {
    TableName: 'IntakeTable',
    KeyConditionExpression: 'userId = :uid AND date = :date',
    ExpressionAttributeValues: {
      ':uid': { S: userId },
      ':date': { S: date },
    },
  };
  const command = new QueryCommand(params);
  const result = await client.send(command);
  return result.Items;
}