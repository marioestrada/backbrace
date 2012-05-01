(function() {
    function handle_existing_attributes(selector, callback, context) {
        if(selector === '*') {
            _(this.toJSON()).each(function(value, key) {
                handle_existing_attributes.call(this, key, callback, context);
            }, this);
            return;
        }

        if(this.has(selector)) {
            callback.call(context, this.get(selector));
        }
    }
    function handle_future_attributes(selector, callback, context) {
        if(selector === '*') {
            this.on('change', function() {
                var prev = this.previousAttributes();
                _(this.changedAttributes()).each(function(value, key) {
                    if(!(key in prev)) {
                        callback.call(context, this.get(key));
                    }
                }, this);
            }, this);
        } else {
            this.on('change:' + selector, function() {
                var prev = this.previousAttributes();
                if(!(selector in prev)) {
                    callback.call(context, this.get(selector));
                }
            }, this);
        }
    }
    function handle_model(selector, callback, context) {
        handle_existing_attributes.call(this, selector, callback);
        handle_future_attributes.call(this, selector, callback, context);
    }

    function handle_existing_models(selector, callback, context) {
        if(selector === '*') {
            this.each(function(model, id) {
                handle_existing_models.call(this, id, callback, context);
            }, this);
            return;
        }

        if(this.get(selector)) {
            callback.call(context, this.get(selector));
        }
    }
    function handle_future_models(selector, callback, context) {
        this.on('add', function(elem) {
            if(selector === '*' || selector === elem.id) {
                callback.call(context, elem);
            }
        }, this);
    }
    function handle_collection(selector, callback, context) {
        handle_existing_models.call(this, selector, callback);
        handle_future_models.call(this, selector, callback);
    }

    var Live = {
        live: function(input, callback, context) {
            var selectors = jQuery.trim(input).split(' ');
            if(selectors.length == 0) return;

            // Detect existing matches, as well as matches that will be added.
            // The callbacks should differ depending on if this is the last selector. 
            if(selectors.length > 1) {
                var finisher = callback;
                callback = function(elem) {
                    if(elem instanceof Backbone.Model || elem instanceof Backbone.Collection) {
                        var tmp = _(selectors).tail().reduce(function(memo, part) { return memo + ' ' + part; });
                        elem.live.call(elem, tmp, finisher, context);
                    }
                };
            }

            var selector = _(selectors).first();

            if(this instanceof Backbone.Model) {
                handle_model.call(this, selector, callback, context);
            } else if(this instanceof Backbone.Collection) {
                handle_collection.call(this, selector, callback, context);
            }
        }
    };
    _.extend(Backbone.Model.prototype, Live);
    _.extend(Backbone.Collection.prototype, Live);
}).call(this);