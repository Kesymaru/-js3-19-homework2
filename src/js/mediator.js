const Mediator = (function () {
    // private variables
    const TOPICS = {};

    return class Mediator {

        /**
         * Gets all the current topics available
         * @returns {Array} topics keys
         */
        static get topics () {
            return Object.keys(TOPICS);
        }

        /**
         * Subcribe a topic
         * If topic does not exits creates a new topic
         * If topic already exits then registers a new callback
         * @param {String} topic
         * @param {Function} callback
         * @returns {Function}
         */
        static Subscribe (topic, callback) {
            if(!topic) throw new Error(`Invalid topic: ${topic}`);
            if(!callback || typeof callback !== 'function')
                throw new Error(`Invalid topic callback: ${callback}`);

            // topics does not exists
            if(!TOPICS.hasOwnProperty(topic)) TOPICS[topic] = [];

            // register the callback
            TOPICS[topic].push(callback);

            // returns the unsubscribe method
            return () => Mediator.Unsubscribe(topic, callback);
        };

        /**
         * Unsubscribe a topic with a callback
         * @param {String} topic
         * @param {Function} callback
         * @returns {Boolean}
         * @constructor
         */
        static Unsubscribe (topic, callback) {
            if(!topic) throw new Error(`Invalid topic: ${topic}`);
            if(!callback || typeof callback !== 'function')
                throw new Error(`Invalid topic callback: ${callback}`);

            if(!TOPICS.hasOwnProperty(topic)) return false;

            // remove the callback for the topic
            TOPICS[topic] = TOPICS[topic].filter(c => c !== callback);

            return true;
        };

        /**
         * Publich a topic
         * @param {String} topic
         * @param {*} data opcional data
         * @returns {Boolean}
         * @constructor
         */
        static Publish (topic, data) {
            if(!topic) throw new Error(`Invalid topic: ${topic}`);

            if(!TOPICS.hasOwnProperty(topic)) return false;
            TOPICS[topic].forEach(callback => callback(data));
            return true;
        };
    }
})();