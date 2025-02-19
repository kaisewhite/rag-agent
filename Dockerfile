FROM public.ecr.aws/bitnami/node:18.20.2-debian-12-r6
RUN apt-get update
# OpenAI Configuration
ENV OPENAI_API_KEY=''
ENV LLM_MODEL=''
# Supabase Configuration
ENV SUPABASE_URL=''
ENV SUPABASE_SERVICE_KEY=''
ENV DATABASE_URL=''
ENV NODE_ENV=
ENV APIKEY=
ENV PORT=
ENV HOST_HEADER=""

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app
RUN npm install && npm install pm2 -g
COPY . /usr/src/app
EXPOSE 5000
EXPOSE 8080
EXPOSE 80
#the --no-daemon flag, which prevents PM2 from running in the background and ensures that its logs are printed to the container's stdout and stderr:
CMD ["pm2-runtime", "server.js", "--no-daemon"]
