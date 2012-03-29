
$(function() {
    var routeTiddlers = 'http://tiddlyweb.tiddlyspace.com/bags/tiddlyweb_public/tiddlers.json?select=tag:httpapi;render=1'
        , host = 'tiddlyweb.tiddlyspace.com'
        , routeInfo = {}
        , defaultRecipe = 'tiddlyweb_public'
        , defaultBag = 'tiddlyweb_public'
        , repMap = {text: 'text/plain',
            'html': 'text/html',
            'json': 'application/json',
            'wiki': 'text/x-tiddlywiki',
        }
        , notGetMessage = "<p>Only <code>GET</code> is support for interaction.</p>";


    // XXX: make me real
    function errorMessage() {
        console.log('something went wrong');
    }

    // Process the route info in proper data.
    function processRouteInfo(tiddlers) {
        $.each(tiddlers, function(index, tiddler) {
            var title = tiddler.title
            routeInfo[title] = {
                text: tiddler.render,
                method: [],
                rep: []
            };
            $.each(tiddler.tags, function(tagIndex, tag) {
                if (tag.match(/^method:/)) {
                    routeInfo[title].method.push(tag.replace(/^method:/, ''));
                }
                if (tag.match(/^rep:/)) {
                    routeInfo[title].rep.push(tag.replace(/^rep:/, ''));
                }
            });
        });
        updateForm();
    }
    
    // update the form with proper route info
    // XXX: this really ought to be sorted
    function updateForm() {
        var selector = $('select[name="route"]');
        selector.empty();
        $('.raw').empty();
        $('.parsed').empty();
        $.each(routeInfo, function(key, value) {
            var option = $('<option>').attr({value: key}).text(key);
            selector.append(option);
        });
        selector.change(updateSubForm).change();
    }

    function updateSubForm(ev) {
        console.log('called update sub');
        var route = $('select=[name="route"]').val();
        $.each(['rep', 'method'], function(index, type) {
            var selector = $('select[name="' + type + '"]');
            selector.empty();
            $.each(routeInfo[route][type], function(index, tag) {
                var option = $('<option>').val(tag).text(tag);
                if (tag == 'get') {
                    option.attr('selected', true);
                }
                selector.append(option);
            });
        });
        $('.info').html(routeInfo[route].text);
        $('#uri').text(route);
        var runInput = $('form[name="runinput"]');
        runInput.empty()
        var matches = route.match(/{\w+}/g) || [];
        $.each(matches, function(index, match) {
            match = match.replace(/{|}/g, '');
            var input = $('<input>').attr({
                name: match,
                type: 'text',
                size: '20'
            })
            .change(updateMessage);
            var label = $('<label>').text(match);
            label.append(input);
            runInput.append(label);
        });
        runInput.append('<input type="submit" value="go!">')
            .submit(handleRequest);
    }

    function handleRequest(ev) {
        ev.preventDefault();
        var url = $('#uri').text();
        var method = $('select[name="method"]').val();
        var rep = $('select[name="rep"]').val();
        mappedRep = repMap[rep] || rep;
        console.log('got handle request', url, method, mappedRep);
        if (method != 'get') {
            displayOutput(notGetMessage, 'html');
        } else {
            $.ajax({
                url: 'http://' + host + url,
                headers: {accept: mappedRep},
                dataType: 'text',
                type: method,
                success: function(data, status, xhr) {
                    var type = xhr.getResponseHeader('content-type');
                    displayOutput(data, rep, type);
                },
                error: function(xhr, status, errorMessage) {
                    console.log('calling update sub');
                    updateSubForm();
                    displayOutput(status + errorMessage, mappedRep);
                }
            });
        }
    }

    function displayOutput(data, rep, type) {
        $('.raw').text(data);
        if (rep == 'html' && type && type.match(/html/)) {
            data = data.replace(/<link[^>]*>/, '')
                .replace(/<script.*\/script>/, '');
            $('.parsed').html(data);
        }
    }

    function updateMessage(ev) {
        var text = $('select=[name="route"]').val();
        $('input[type="text"]').each(function(index) {
            var value = $(this).val();
            var name = $(this).attr('name');
            text = text.replace('{' + name + '}', encodeURIComponent(value));
        });
        $('#uri').text(text);
    }

    // Start up by getting current route info.
    function getRouteInfo() {
        $.ajax({
            url: routeTiddlers,
            type: 'GET',
            dataType: 'json',
            success: processRouteInfo,
            error: errorMessage,
        });
    }

    getRouteInfo();
});
