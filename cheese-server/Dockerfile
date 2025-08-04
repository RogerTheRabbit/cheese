FROM node:latest

# Force check for changes so know when to rebuild
ADD "https://api.github.com/repos/RogerTheRabbit/cheese/commits?per_page=1" latest_commit
RUN rm ./latest_commit

RUN git clone --no-checkout https://github.com/RogerTheRabbit/cheese.git /src
WORKDIR /src
RUN git sparse-checkout init
RUN git sparse-checkout set cheese-server
RUN git checkout main
WORKDIR /src/cheese-server
RUN npm install
EXPOSE 3000
ENTRYPOINT ["npm", "run", "prod"]
