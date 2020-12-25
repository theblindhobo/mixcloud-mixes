  // Posting new Mixcloud shows in channel
  const mixcloudCreds = {
    username: '<MIXCLOUD-USERNAME>',
    accessToken: '<MIXCLOUD-APP-ACCESS-TOKEN>'
  };
  const mixcloudObj = {
    key: '',
    createTime: '',
    url: ''
  };
  const mixcloudUrl = `https://api.mixcloud.com/${mixcloudCreds.username}/feed/?access_token=${mixcloudCreds.accessToken}`;
  function fetchNewShows() {
    fetch(mixcloudUrl)
    .then(response => response.json())
    .then(data => {
      const firstInFeed = data.data[0].cloudcasts[0];
      const newestEntry = {
        key: firstInFeed.key,
        createTime: firstInFeed.created_time,
        url: firstInFeed.url,
        name: firstInFeed.name,
        image: firstInFeed.pictures.extra_large,
        thumbnail: firstInFeed.pictures.medium_mobile,
        logo: firstInFeed.user.pictures.large
      };
      if(newestEntry.key !== mixcloudObj.key && newestEntry.createTime !== mixcloudObj.createTime) {
        // There's a new entry
        // Check latest channel message to see if it's same as this entry
        // Heroku performs cycling on a daily basis, so this would prevent double posting
        bot.channels.fetch('<CHANNEL-ID>')
        .then(channel => {
          channel.messages.fetch({ limit: 1 })
          .then(messages => {
            var lastMessage = messages.first().content;
            if(lastMessage.includes(newestEntry.url)) {
              console.log('MIXCLOUD: Bot already posted this link before.');
            }
            else if(!lastMessage.includes(newestEntry.url)) {
              console.log("MIXCLOUD: New show on Mixcloud, posting to channel now.");
              // Fetching the description for the Embed message
              fetch(`https://api.mixcloud.com${newestEntry.key}`)
                .then(response => response.json())
                .then(data => {
                  const newestEntryDescription = data.description;
                  // Create an embed
                  const mixcloudEmbed = new Discord.MessageEmbed()
                      .setColor('#111111')
                      .setTitle(newestEntry.name)
                      .setURL(newestEntry.url)
                      .setAuthor('Octopus Recordings')
                      .setDescription(newestEntryDescription)
                      // .setThumbnail(newestEntry.logo)
                      .setThumbnail(newestEntry.image)
                      .setTimestamp();
                  channel.send(`New show on Mixcloud: <${newestEntry.url}>`, { embed: mixcloudEmbed });
                })
                .catch(error => console.log(error.message));
            }
          })
          .catch(console.err);
        })
        // Update existing object
        mixcloudObj.key = newestEntry.key;
        mixcloudObj.createTime = newestEntry.createTime;
        mixcloudObj.url = newestEntry.url;
      }
      else {
        console.log("No new shows at this time.");
      }
    })
    .catch(error => console.log(error.message));
  };
  function runQueryMixcloud() {
    fetchNewShows();
    setInterval(fetchNewShows, 3600000); // Every hour, check if new show
  }
  runQueryMixcloud();
