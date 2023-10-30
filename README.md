<h1 id="mongodb"> MongoDB :leaves:</h1>

Up to this point, when we had to store data, we used the filesystem to do so. But the more data we store the more the need arises for more efficient, organized and structured way to store data. This is where databases come in.

<img src="assets/mongodb.png" align="left" alt="mongodb Logo"  width="80"/>
In this guide we will learn about a specific database called **MongoDB**.

**MongoDB** is a document-oriented database, which means that it stores data in JSON-like documents. It exposes an API that is very easy to work with, making it very popular among developers.

<h2 id="table-of-contents">:scroll: Table of Contents</h2>

- [MongoDB :leaves:](#mongodb)
  - [:scroll: Table of Contents](#table-of-contents)
  - [:rocket: Introduction](#introduction)
  - [:books: Resources](#resources)
  - [:clipboard: Topics](#topics)
  - [:computer: Installation](#installation)
  - [:dart: Assignments](#assignments)
    - [:dart: Assignment 1 - Football Team Manager](#assignment-1)
    - [:dart: Assignment 2 - Football Team Manager with Mongoose](#assignment-2)
    - [:dart: ★ Assignment 5 (Bonus) - Advanced aggregations](#assignment-bonus)
  - [★ Bonus content](#bonus-content)
    - [★ Transactions](#bonus-transactions)
    - [★ Discriminators](#bonus-discriminators)
    - [★ Sharding & Replica-Sets](#bonus-sharding-replica-sets)

<h2 id="introduction">:rocket: Introduction</h2>

Before we start working with **MongoDB**, we first need to understand what even are databases.

Read the following resources to learn about databases:

1. [Database - Wikipedia](https://en.wikipedia.org/wiki/Database)
2. [Why are Databases Important?](https://databasetown.com/why-are-databases-important/)
3. [SQL vs NoSQL](https://www.youtube.com/watch?v=ZS_kXvOeQ5Y)

Now we are ready to move on to **MongoDB**.

<h2 id="resources">:books: Resources</h2>

- [MongoDB](https://www.mongodb.com/what-is-mongodb) - What is MongoDB?
- [MongoDB - Official Documentation](https://docs.mongodb.com/manual/introduction/) - MongoDB official documentation.
- [MongoDB CRUD Operations](https://docs.mongodb.com/manual/crud/) - MongoDB CRUD Operations.
- [MongoDB Full Tutorial](https://www.youtube.com/watch?v=4yqu8YF29cU) - A great video tutorial on MongoDB.
- [Mongoose](https://mongoosejs.com/) - Mongoose official documentation.

★ *Even though I highly recommend using the above resources, feel free to use any other resource you find online. Just make sure it is up to date and covers the [**topics**](#topics) listed below.*

<h2 id="topics">:clipboard: Topics</h2>

- Basic CRUD operations
  - Create
  - Find
  - Update
  - Delete
- Aggregation operations
  - Aggregation pipeline
  - Aggregation stages
  - Aggregation operators
- Indexes
  - Types of indexes
  - When to use indexes
- Mongoose
  - Schema
  - Models
  - Queries
  - Middleware

<h2 id="installation">:computer: Installation</h2>

For now we'll install MongoDB server on our computer, the same way we would install any other application. Later on when we learn **Docker you'll** we'll cover a better way for using MongoDB.

To install **MongoDb** follow the installation instructions [here](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/).

In short, you'll need to run the following commands:

```bash
sudo apt-get install gnupg curl

curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt-get update

sudo apt-get install -y mongodb-org
```

:information_source: When you finish installing mongoDB, download [MongoDB Compass](https://www.mongodb.com/try/download/compass) as well (**make sure you choose the Ubuntu version**). It's a GUI (Graphical user interface) for mongoDB, and it will make it easier for you to work with mongoDB.

<h2 id="assignments">:dart: Assignments</h2>

<h3 id="assignment-1"> :dart: Assignment 1 - Football Team Manager</h3>

Create an express server that will expose an API for managing football teams.

The server should use a mongoDB database to store the data. Using the file system is not allowed.

The data will be as follows: (Store the data in the DB any way you see fit)

- Player first name
- Player last name
- Player nationality
- Player number
- Player cost
- Player team
- Team name
- Team budget

Constraints:

- Each team will have at most 5 players.
- Each player can be in only one team.
- A team cannot have players whose total cost is greater than the team's budget.
- A team name should be unique.

The server should expose the following API:

- Create a new team
- Create a new player
- Add a player to a team
- Get all players in a team
- Get a player by his first or last names - the input does not have to be a precise match. For example, when trying to get a player with the name "Cristiano Ronaldo", both "Cris" and "naldo" should return the player.
- Get all players in a team with a number greater than or equal to input number.
- Get the top 3 teams with most Brazilian players ordered by the most to the least.
- Update a player's team by his name.
- Delete a player by his name (don't forget to delete him from the team as well).
- Delete a team by its name (All the players in the team will not be associated with any team).

Additional requirements:

- :exclamation: **For this assignment, use the default [MongoDB driver](https://www.npmjs.com/package/mongodb), not Mongoose.**
- Add appropriate indexes to the database - Add them in the script itself.
- Plan the collections in a way that will make the queries as efficient as possible (consult with your instructors if you are not sure how to do it).

<h3 id="assignment-2">:dart: Assignment 2 - Football Team Manager with Mongoose</h3>

Recreate the previous assignment, but this time use Mongoose. Create a schema and model for each collection. Use the model to perform the queries.

Add routes that will perform the following actions:

- Aggregate all the players from Spain. The query will return the full name of the player along with his team name.
- Get the top 3 non Spanish players that cost The most.

<h3 id="assignment-bonus">:dart: ★ Assignment 3 (Bonus) - Advanced aggregations</h3>

Add the following routes to the server:

- Aggregation that will return all of the Players that a team can buy (the teams budget minus the sum of its players' cost is greater than the player cost). Return objects including a  **team name**, **team budget**, and a array of players that includes the **player's full name** and **cost**

<h2 id="bonus-content">★ Bonus content</h2>

<h3 id="bonus-transactions">★ Transactions</h3>

Read about [mongoDB transactions](https://docs.mongodb.com/manual/core/transactions/).
Make sure you understand what transactions are, why do we need them, how and when to use them.

<h3 id="bonus-discriminators">★ Discriminators</h3>

Read about [mongoDB (mongoose) discriminators](https://mongoosejs.com/docs/discriminators.html).
Like before, you need to understand what discriminators are, why do we need them, how and when to use them.

To better understand discriminators, we can think about them as a way to create a hierarchy of models that inherit from each other. Just like **OOP inheritance**. For example, we can have a model called `Animal`, and two models that inherit from it - `Dog` and `Cat`. The `Dog` and `Cat` models will have all the fields of the `Animal` model, and they can have additional fields of their own.

A real world example for this can be a `User` model, and two models that inherit from it - `Admin` and `Customer`. The `Admin` and `Customer` models will have all the fields of the `User` model, and they can have additional fields of their own.

<h3 id="bonus-sharding-replica-sets">★ Sharding & Replica-Sets</h3>

Read about [MongoDB replication](https://www.mongodb.com/docs/manual/replication/) and [MongoDB sharding](https://www.mongodb.com/docs/manual/sharding/)

This is an important topic to understand, since when you start working on real projects, you will have to deploy your database in a way that will make it scalable, efficient and reliable.
