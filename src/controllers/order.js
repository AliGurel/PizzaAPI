"use strict"
/* -------------------------------------------------------
    NODEJS EXPRESS | CLARUSWAY FullStack Team
------------------------------------------------------- */
// Order Controller:

const Order = require('../models/order')
const Pizza = require('../models/pizza')
const sendMail = require('../helpers/sendMail')

module.exports = {

    list: async (req, res) => {
        /*
            #swagger.tags = ["Orders"]
            #swagger.summary = "List Orders"
            #swagger.description = `
                You can send query with endpoint for filter[], search[], sort[], page and limit.
                <ul> Examples:
                    <li>URL/?<b>filter[field1]=value1&filter[field2]=value2</b></li>
                    <li>URL/?<b>search[field1]=value1&search[field2]=value2</b></li>
                    <li>URL/?<b>sort[field1]=1&sort[field2]=-1</b></li>
                    <li>URL/?<b>page=2&limit=1</b></li>
                </ul>
            `
        */
        // Manage only self-record.
        let customFilter = {}
        if (!req.user.isAdmin) {
            customFilter = { userId: req.user.id }
        }

        //const data = await res.getModelList(Order, customFilter, ['userId', 'pizzaId'])//['userId','pizzaId'] 2li populate
        const data = await res.getModelList(Order, customFilter, [
            'userId',
            { path: 'pizzaId', select: '-__v', populate: { path: 'toppingIds', select: 'name' } } //select: '-_id name' yazarsak id yi de göstermez sadece name i gösterir
        ])//['userId','pizzaId'] 3lü populate, pizza içinde topping i de populate yaptı, nested populate

        res.status(200).send({
            error: false,
            details: await res.getModelListDetails(Order, customFilter),
            data
        })
    },

    // CRUD:

    create: async (req, res) => {
        /*
            #swagger.tags = ["Orders"]
            #swagger.summary = "Create Order"
        */

        // get price from the pizza:
        if (!req.body?.price) {
            const pizzaData = await Pizza.findOne({ _id: req.body.pizzaId })
            req.body.price = pizzaData.price
        }

        const data = await Order.create(req.body)

        //hoşgeldin maili gönderelim
        sendMail(
            data.email,//to
            'Siparişiniz Alındı', //subject
            //Message:
            `
                <h1>${data.username}</h1>
                <p>Siparişiniz Alındı.</p>
            `
        )

        res.status(201).send({
            error: false,
            data
        })
    },

    read: async (req, res) => {
        /*
            #swagger.tags = ["Orders"]
            #swagger.summary = "Get Single Order"
        */
        let customFilter = {}
        if (!req.user.isAdmin) {
            customFilter = { userId: req.user.id }
        }
        const data = await Order.findOne({ _id: req.params.id, ...customFilter }).populate(['userId', 'pizzaId'])

        res.status(200).send({
            error: false,
            data
        })
    },

    update: async (req, res) => {
        /*
            #swagger.tags = ["Orders"]
            #swagger.summary = "Update Order"
        */

        const data = await Order.updateOne({ _id: req.params.id }, req.body, { runValidators: true })

        res.status(202).send({
            error: false,
            data,
            new: await Order.findOne({ _id: req.params.id })
        })
    },

    delete: async (req, res) => {
        /*
            #swagger.tags = ["Orders"]
            #swagger.summary = "Delete Order"
        */

        const data = await Order.deleteOne({ _id: req.params.id })

        res.status(data.deletedCount ? 204 : 404).send({
            error: !data.deletedCount,
            data
        })
    }
}