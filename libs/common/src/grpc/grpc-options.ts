import { GrpcOptions, Transport } from "@nestjs/microservices";

export function grpcOptions(packageName: string, protoPath: string, url: string): GrpcOptions {
  return {
    transport: Transport.GRPC,
    options: {
      package: packageName,
      protoPath,
      url,
      loader: {
        keepCase: false,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: false,
      },
    },
  };
}
