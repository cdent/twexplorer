
$(function() {
    var routeTiddlers = '/bags/tiddlyweb_public/tiddlers.json?select=tag:httpapi;render=1'
        , routeInfo = {}
        , defaultRecipe = 'tiddlyweb_public'
        , defaultBag = 'tiddlyweb_public'
        , repMap = {text: 'text/plain',
            'html': 'text/html',
            'json': 'application/json',
            'wiki': 'text/x-tiddlywiki',
        }
        , notGetMessage = "<p>Only <code>GET</code> is support for interaction.</p>";

    $.ajaxSetup({
        beforeSend: function(xhr) {
                        xhr.setRequestHeader("X-ControlView", "false");
                    }
    });


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
        $.each(routeInfo, function(key, value) {
            var option = $('<option>').attr({value: key}).text(key);
            selector.append(option);
        });
        selector.change(updateSubForm).change();
    }

    function updateSubForm(ev) {
        var route = $('select[name="route"]').val();
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
        $('.raw').empty();
        $('.info').html(routeInfo[route].text);
        var infoTitle = $('<h1>').text(route).attr('class', 'infoTitle');
        $('.info').prepend(infoTitle);
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
            var label = $('<label>')
                .text(match + ':')
                .attr('for', match);
            runInput.append(label).append(input).append('<br>');
        });
        runInput.append('<button type="submit">Get!</button>')
            .submit(handleRequest);
    }

    function handleRequest(ev) {
        ev.preventDefault();
        var url = $('#uri').text();
        var method = $('select[name="method"]').val();
        var rep = $('select[name="rep"]').val();
        mappedRep = repMap[rep] || rep;
        if (url == '/search') {
            url = url + '?q=';
        }
		console.log('url1', url);
        url = url.replace(/{\w+}/g, function(match) {
			var inputName = match.replace(/{|}/g, ''),
				selector = 'input[name="' + inputName + '"]';

			console.log(inputName, selector);
			return $(selector).val();
		});
		console.log('url2', url);

        if (method != 'get') {
            displayOutput(notGetMessage, 'html');
        } else {
            $.ajax({
                url: url,
                headers: {accept: mappedRep},
                dataType: 'text',
                type: method,
                success: function(data, status, xhr) {
                    var type = xhr.getResponseHeader('content-type');
                    displayOutput(data, rep, type);
                },
                error: function(xhr, status, errorMessage) {
                    updateSubForm();
                    displayOutput(status + errorMessage, mappedRep);
                }
            });
        }
    }

    function displayOutput(data, rep, type) {
        if (rep == 'html' && type && type.match(/text\/html/)) {
            data = data.replace(/<link[^>]*>/g, '')
                .replace(/<script.*\/script>/g, '');
            $('.raw').html(data);
        } else {
            $('.raw').html('<pre>' + data + '</pre>');
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
